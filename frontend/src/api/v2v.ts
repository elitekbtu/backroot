import { apiClient } from './client';

// Simplified types for V2V service
export interface VoiceServiceStatus {
  status: 'operational' | 'error';
  openai_api_key_valid: boolean;
  active_connections: number;
  active_sessions: number;
  error?: string;
}

export interface ModelTestResults {
  gpt_model: boolean;
  tts_model: boolean;
  stt_model: boolean;
  error?: string;
}

export interface ConversationEntry {
  timestamp: string;
  user_input: string;
  ai_response: string;
  type: 'voice' | 'text';
}

export interface VoiceResponseMessage {
  type: 'voice_response';
  transcript: string;
  ai_response: string;
  audio_response: string;
  timestamp: string;
}

export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error';
export type VoiceProcessingState = 'idle' | 'recording' | 'processing' | 'playing' | 'error';

// Simplified V2V Service Class
export class V2VService {
  private websocket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentAudio: HTMLAudioElement | null = null;

  // State
  private _connectionState: WebSocketState = 'disconnected';
  private _processingState: VoiceProcessingState = 'idle';
  private _isRecording = false;

  // Event handlers
  private onConnectionChange: ((state: WebSocketState) => void) | null = null;
  private onVoiceResponse: ((response: VoiceResponseMessage) => void) | null = null;
  private onProcessingStatus: ((status: { status: string; message: string }) => void) | null = null;
  private onError: ((error: { message: string }) => void) | null = null;
  private onConversationHistory: ((response: { history: ConversationEntry[] }) => void) | null = null;

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
  setOnConnectionChange(handler: (state: WebSocketState) => void) {
    this.onConnectionChange = handler;
  }

  setOnVoiceResponse(handler: (response: VoiceResponseMessage) => void) {
    this.onVoiceResponse = handler;
  }

  setOnProcessingStatus(handler: (status: { status: string; message: string }) => void) {
    this.onProcessingStatus = handler;
  }

  setOnError(handler: (error: { message: string }) => void) {
    this.onError = handler;
  }

  setOnConversationHistory(handler: (response: { history: ConversationEntry[] }) => void) {
    this.onConversationHistory = handler;
  }

  // REST API Methods
  async getServiceStatus(): Promise<{ success: boolean; data?: VoiceServiceStatus; error?: { detail: string } }> {
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

  async testModels(): Promise<{ success: boolean; data?: ModelTestResults; error?: { detail: string } }> {
    try {
      const response = await apiClient.get<any>('/voice/test-models');
      // Backend returns { models: {...} } format, extract the models
      const modelData = response.models || response;
      return { success: true, data: modelData };
    } catch (error) {
      return {
        success: false,
        error: { detail: error instanceof Error ? error.message : 'Failed to test models' }
      };
    }
  }

  // WebSocket Connection
  async connect(userId: string): Promise<boolean> {
    try {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        return true;
      }

      this._connectionState = 'connecting';
      this.onConnectionChange?.(this._connectionState);

      // Correct WebSocket URL based on backend structure
      const wsUrl = `wss://46.101.187.24/api/v1/voice/ws/v2v/${userId}`;
      
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        this._connectionState = 'connected';
        this.onConnectionChange?.(this._connectionState);
        console.log('V2V WebSocket connected');
      };

      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.websocket.onclose = (event) => {
        this._connectionState = 'disconnected';
        this.onConnectionChange?.(this._connectionState);
        console.log('V2V WebSocket disconnected', event.code, event.reason);
      };

      this.websocket.onerror = (error) => {
        this._connectionState = 'error';
        this.onConnectionChange?.(this._connectionState);
        this.onError?.({ message: 'WebSocket connection error' });
        console.error('V2V WebSocket error:', error);
      };

      return true;
    } catch (error) {
      this._connectionState = 'error';
      this.onConnectionChange?.(this._connectionState);
      this.onError?.({ message: error instanceof Error ? error.message : 'Failed to connect' });
      return false;
    }
  }

  disconnect(): void {
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
      const message = JSON.parse(data);
      console.log('Received message:', message);
      
      switch (message.type) {
        case 'connection_status':
          console.log('Connection status:', message);
          break;
        case 'processing_status':
          this._processingState = message.status === 'processing' ? 'processing' : 'idle';
          this.onProcessingStatus?.(message);
          break;
        case 'voice_response':
          this._processingState = 'idle';
          this.onVoiceResponse?.(message);
          break;
        case 'conversation_history':
          this.onConversationHistory?.(message);
          break;
        case 'error':
          this.onError?.({ message: message.message });
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      this.onError?.({ message: 'Failed to parse WebSocket message' });
    }
  }

  // Send message to WebSocket
  private sendMessage(message: any): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.onError?.({ message: 'WebSocket not connected' });
      return false;
    }

    try {
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.onError?.({ message: 'Failed to send message' });
      return false;
    }
  }

  // Voice Recording
  async startRecording(): Promise<boolean> {
    try {
      if (this._isRecording) {
        return true;
      }

      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported. Please use HTTPS or localhost.');
      }

      // Check if we're on HTTPS or localhost
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('Microphone access requires HTTPS. Please use HTTPS or localhost.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
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

      this.mediaRecorder.start(100);
      this._isRecording = true;
      this._processingState = 'recording';

      return true;
    } catch (error) {
      let errorMessage = 'Failed to start recording: ';
      if (error instanceof Error) {
        if (error.message.includes('MediaDevices API not supported')) {
          errorMessage = 'Microphone access not supported. Please use a modern browser with HTTPS.';
        } else if (error.message.includes('HTTPS')) {
          errorMessage = 'Microphone access requires HTTPS. Please access the site via HTTPS.';
        } else if (error.message.includes('Permission denied')) {
          errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error';
      }
      this.onError?.({ message: errorMessage });
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
    if (this.audioChunks.length === 0) {
      console.warn('No audio chunks to process');
      return;
    }

    try {
      const audioBlob = new Blob(this.audioChunks, { 
        type: 'audio/webm' 
      });
      
      console.log('Audio blob size:', audioBlob.size, 'bytes');
      
      if (audioBlob.size === 0) {
        console.error('Audio blob is empty');
        this.onError?.({ message: 'Recorded audio is empty' });
        return;
      }
      
      const base64Audio = await this.blobToBase64(audioBlob);
      console.log('Base64 audio length:', base64Audio.length);
      
      if (!base64Audio || base64Audio.length === 0) {
        console.error('Base64 audio is empty');
        this.onError?.({ message: 'Failed to encode audio' });
        return;
      }
      
      const message = {
        type: 'voice_input',
        audio_data: base64Audio
      };

      console.log('Sending voice input message');
      this.sendMessage(message);
      this.audioChunks = [];
    } catch (error) {
      console.error('Error processing recording:', error);
      this.onError?.({ message: 'Failed to process recording' });
    }
  }

  // Send text input
  sendTextInput(text: string): boolean {
    const message = {
      type: 'text_input',
      text: text
    };
    return this.sendMessage(message);
  }

  // Audio Playback
  async playAudioResponse(audioData: string): Promise<void> {
    try {
      // Stop current audio if playing
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      this._processingState = 'playing';
      
      // Notify about processing state change
      this.onProcessingStatus?.({ status: 'playing', message: 'Playing audio response' });
      
      // Create audio element and play
      this.currentAudio = new Audio();
      this.currentAudio.src = `data:audio/mp3;base64,${audioData}`;
      
      this.currentAudio.onended = () => {
        this._processingState = 'idle';
        this.currentAudio = null;
        // Notify about processing state change
        this.onProcessingStatus?.({ status: 'idle', message: 'Audio playback finished' });
      };

      this.currentAudio.onerror = () => {
        this._processingState = 'idle';
        this.currentAudio = null;
        this.onError?.({ message: 'Failed to play audio' });
        // Notify about processing state change
        this.onProcessingStatus?.({ status: 'idle', message: 'Audio playback error' });
      };

      await this.currentAudio.play();
    } catch (error) {
      this._processingState = 'idle';
      this.onError?.({ message: 'Failed to play audio response' });
      // Notify about processing state change
      this.onProcessingStatus?.({ status: 'idle', message: 'Audio playback failed' });
    }
  }

  // Conversation Management
  requestConversationHistory(): boolean {
    const message = { type: 'get_history' };
    return this.sendMessage(message);
  }

  clearConversationHistory(): boolean {
    const message = { type: 'clear_history' };
    return this.sendMessage(message);
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
}

// Export singleton instance
export const v2vService = new V2VService();
export default v2vService;