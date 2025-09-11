import { apiClient } from './client';
import type {
  VoiceServiceStatus,
  ModelTestResults,
  AvailableModels,
  UserSessionInfo,
  VoiceServiceStats,
  V2VApiResponse,
  WebSocketMessage,
  ConnectionStatusMessage,
  ProcessingStatusMessage,
  VoiceInputMessage,
  TextInputMessage,
  VoiceResponseMessage,
  LipSyncDataMessage,
  ConversationHistoryMessage,
  HistoryClearedMessage,
  ErrorMessage,
  PingMessage,
  WebSocketState,
  V2VConfig,
  AudioConfig,
  VoiceProcessingState,
  VoiceEventHandler,
  ErrorEventHandler,
  ConnectionEventHandler
} from '../types/v2v';

// Default configuration
const DEFAULT_CONFIG: V2VConfig = {
  websocketUrl: 'ws://localhost:8000/api/v1/voice/ws/v2v',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  pingInterval: 30000
};

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000,
  channels: 1,
  bitRate: 128000,
  format: 'webm'
};

export class V2VService {
  private websocket: WebSocket | null = null;
  private config: V2VConfig;
  private audioConfig: AudioConfig;
  private reconnectAttempts = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  // Event handlers
  private onConnectionChange: ConnectionEventHandler | null = null;
  private onVoiceResponse: VoiceEventHandler | null = null;
  private onProcessingStatus: VoiceEventHandler | null = null;
  private onError: ErrorEventHandler | null = null;
  private onConversationHistory: VoiceEventHandler | null = null;
  private onLipSyncData: VoiceEventHandler | null = null;

  // State
  private _connectionState: WebSocketState = 'disconnected';
  private _processingState: VoiceProcessingState = 'idle';
  private _isRecording = false;

  constructor(config: Partial<V2VConfig> = {}, audioConfig: Partial<AudioConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.audioConfig = { ...DEFAULT_AUDIO_CONFIG, ...audioConfig };
  }

  // Getters
  get connectionState(): WebSocketState {
    return this._connectionState;
  }

  get processingState(): VoiceProcessingState {
    return this._processingState;
  }

  get isRecording(): boolean {
    return this._isRecording;
  }

  get isConnected(): boolean {
    return this._connectionState === 'connected';
  }

  // Event handler setters
  setOnConnectionChange(handler: ConnectionEventHandler) {
    this.onConnectionChange = handler;
  }

  setOnVoiceResponse(handler: VoiceEventHandler) {
    this.onVoiceResponse = handler;
  }

  setOnProcessingStatus(handler: VoiceEventHandler) {
    this.onProcessingStatus = handler;
  }

  setOnError(handler: ErrorEventHandler) {
    this.onError = handler;
  }

  setOnConversationHistory(handler: VoiceEventHandler) {
    this.onConversationHistory = handler;
  }

  setOnLipSyncData(handler: VoiceEventHandler) {
    this.onLipSyncData = handler;
  }

  // REST API Methods
  async getServiceStatus(): Promise<V2VApiResponse<VoiceServiceStatus>> {
    try {
      const response = await apiClient.get<VoiceServiceStatus>('/voice/status');
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: { detail: error instanceof Error ? error.message : 'Failed to get service status' }
      };
    }
  }

  async testModels(): Promise<V2VApiResponse<ModelTestResults>> {
    try {
      const response = await apiClient.get<ModelTestResults>('/voice/test-models');
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: { detail: error instanceof Error ? error.message : 'Failed to test models' }
      };
    }
  }

  async getAvailableModels(): Promise<V2VApiResponse<AvailableModels>> {
    try {
      const response = await apiClient.get<AvailableModels>('/voice/models');
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: { detail: error instanceof Error ? error.message : 'Failed to get available models' }
      };
    }
  }

  async getUserSessionInfo(userId: string): Promise<V2VApiResponse<UserSessionInfo>> {
    try {
      const response = await apiClient.get<UserSessionInfo>(`/voice/sessions/${userId}`);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: { detail: error instanceof Error ? error.message : 'Failed to get session info' }
      };
    }
  }

  async clearUserSession(userId: string): Promise<V2VApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/voice/sessions/${userId}`);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: { detail: error instanceof Error ? error.message : 'Failed to clear session' }
      };
    }
  }

  async getServiceStats(): Promise<V2VApiResponse<VoiceServiceStats>> {
    try {
      const response = await apiClient.get<VoiceServiceStats>('/voice/stats');
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: { detail: error instanceof Error ? error.message : 'Failed to get service stats' }
      };
    }
  }

  // WebSocket Methods
  async connect(userId: string): Promise<boolean> {
    try {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        return true;
      }

      this._connectionState = 'connecting';
      this.onConnectionChange?.(this._connectionState);

      const token = localStorage.getItem('access_token');
      const wsUrl = `${this.config.websocketUrl}/${userId}${token ? `?token=${token}` : ''}`;
      
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        this._connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(this._connectionState);
        this.startPingInterval();
      };

      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.websocket.onclose = (event) => {
        this._connectionState = 'disconnected';
        this.onConnectionChange?.(this._connectionState);
        this.stopPingInterval();
        
        if (event.code !== 1000 && this.reconnectAttempts < this.config.reconnectAttempts) {
          this.scheduleReconnect(userId);
        }
      };

      this.websocket.onerror = () => {
        this._connectionState = 'error';
        this.onConnectionChange?.(this._connectionState);
        this.onError?.(new Error('WebSocket connection error'));
      };

      return true;
    } catch (error) {
      this._connectionState = 'error';
      this.onConnectionChange?.(this._connectionState);
      this.onError?.(error instanceof Error ? error : new Error('Failed to connect'));
      return false;
    }
  }

  disconnect(): void {
    this.stopPingInterval();
    this.stopRecording();
    
    if (this.websocket) {
      this.websocket.close(1000, 'Client disconnect');
      this.websocket = null;
    }
    
    this._connectionState = 'disconnected';
    this.onConnectionChange?.(this._connectionState);
  }

  // WebSocket Message Handling
  private handleWebSocketMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'connection_status':
          this.handleConnectionStatus(message as ConnectionStatusMessage);
          break;
        case 'processing_status':
          this.handleProcessingStatus(message as ProcessingStatusMessage);
          break;
        case 'voice_response':
          this.handleVoiceResponse(message as VoiceResponseMessage);
          break;
        case 'lip_sync_data':
          this.handleLipSyncData(message as LipSyncDataMessage);
          break;
        case 'conversation_history':
          this.handleConversationHistory(message as ConversationHistoryMessage);
          break;
        case 'history_cleared':
          this.handleHistoryCleared(message as HistoryClearedMessage);
          break;
        case 'error':
          this.handleError(message as ErrorMessage);
          break;
        case 'pong':
          // Handle pong response
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      this.onError?.(new Error('Failed to parse WebSocket message'));
    }
  }

  private handleConnectionStatus(message: ConnectionStatusMessage): void {
    console.log('Connection status:', message);
  }

  private handleProcessingStatus(message: ProcessingStatusMessage): void {
    this._processingState = message.status === 'processing' ? 'processing' : 'idle';
    this.onProcessingStatus?.(message);
  }

  private handleVoiceResponse(message: VoiceResponseMessage): void {
    this._processingState = 'idle';
    this.onVoiceResponse?.(message);
  }

  private handleLipSyncData(message: LipSyncDataMessage): void {
    this.onLipSyncData?.(message);
  }

  private handleConversationHistory(message: ConversationHistoryMessage): void {
    this.onConversationHistory?.(message);
  }

  private handleHistoryCleared(message: HistoryClearedMessage): void {
    console.log('History cleared:', message.message);
  }

  private handleError(message: ErrorMessage): void {
    this.onError?.(new Error(message.message));
  }

  // WebSocket Message Sending
  private sendMessage(message: WebSocketMessage): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.onError?.(new Error('WebSocket not connected'));
      return false;
    }

    try {
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.onError?.(error instanceof Error ? error : new Error('Failed to send message'));
      return false;
    }
  }

  // Voice Input Methods
  async startRecording(): Promise<boolean> {
    try {
      if (this._isRecording) {
        return true;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: this.audioConfig.sampleRate,
          channelCount: this.audioConfig.channels,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: `audio/${this.audioConfig.format};codecs=opus`
      });

      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this._isRecording = true;
      this._processingState = 'recording';

      return true;
    } catch (error) {
      this.onError?.(error instanceof Error ? error : new Error('Failed to start recording'));
      return false;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this._isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this._isRecording = false;
    }
  }

  private async processRecording(): Promise<void> {
    if (this.audioChunks.length === 0) return;

    try {
      const audioBlob = new Blob(this.audioChunks, { 
        type: `audio/${this.audioConfig.format}` 
      });
      
      const base64Audio = await this.blobToBase64(audioBlob);
      
      const message: VoiceInputMessage = {
        type: 'voice_input',
        audio_data: base64Audio
      };

      this.sendMessage(message);
      this.audioChunks = [];
    } catch (error) {
      this.onError?.(error instanceof Error ? error : new Error('Failed to process recording'));
    }
  }

  sendTextInput(text: string): boolean {
    const message: TextInputMessage = {
      type: 'text_input',
      text: text
    };
    return this.sendMessage(message);
  }

  // Audio Playback
  async playAudioResponse(audioData: string): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const audioBuffer = await this.base64ToAudioBuffer(audioData);
      
      if (this.sourceNode) {
        this.sourceNode.stop();
      }

      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = audioBuffer;
      this.sourceNode.connect(this.gainNode!);

      this._processingState = 'playing';
      this.sourceNode.onended = () => {
        this._processingState = 'idle';
      };

      this.sourceNode.start();
    } catch (error) {
      this.onError?.(error instanceof Error ? error : new Error('Failed to play audio'));
    }
  }

  // Utility Methods
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:audio/...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async base64ToAudioBuffer(base64Data: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return await this.audioContext.decodeAudioData(bytes.buffer);
  }

  // WebSocket Management
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, this.config.pingInterval);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendPing(): void {
    const message: PingMessage = { type: 'ping' };
    this.sendMessage(message);
  }

  private scheduleReconnect(userId: string): void {
    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect(userId);
    }, this.config.reconnectDelay * this.reconnectAttempts);
  }

  // Conversation Management
  requestConversationHistory(): boolean {
    const message: WebSocketMessage = { type: 'get_history' };
    return this.sendMessage(message);
  }

  clearConversationHistory(): boolean {
    const message: WebSocketMessage = { type: 'clear_history' };
    return this.sendMessage(message);
  }

  requestLipSyncData(text: string): boolean {
    const message: WebSocketMessage = { 
      type: 'get_lip_sync_data',
      text: text
    };
    return this.sendMessage(message);
  }
}

// Export singleton instance
export const v2vService = new V2VService();
export default v2vService;
