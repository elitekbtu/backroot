// V2V (Voice-to-Voice) Types

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

export interface AvailableModels {
  available_models: string[];
  configured_models: {
    gpt: string;
    tts: string;
    stt: string;
  };
}

export interface UserSessionInfo {
  user_id: string;
  connected_at: string;
  is_processing: boolean;
  conversation_count: number;
}

export interface VoiceServiceStats {
  active_connections: number;
  active_sessions: number;
  total_conversations: number;
  service_status: string;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface ConnectionStatusMessage extends WebSocketMessage {
  type: 'connection_status';
  status: 'connected' | 'disconnected';
  message: string;
}

export interface ProcessingStatusMessage extends WebSocketMessage {
  type: 'processing_status';
  status: 'processing' | 'idle';
  message: string;
}

export interface VoiceInputMessage extends WebSocketMessage {
  type: 'voice_input';
  audio_data: string; // Base64 encoded audio
}

export interface TextInputMessage extends WebSocketMessage {
  type: 'text_input';
  text: string;
}

export interface VoiceResponseMessage extends WebSocketMessage {
  type: 'voice_response';
  transcript: string;
  ai_response: string;
  audio_response: string; // Base64 encoded audio
  lip_sync_data: LipSyncData;
  timestamp: string;
}

export interface LipSyncDataMessage extends WebSocketMessage {
  type: 'lip_sync_data';
  text: string;
  lip_sync_data: LipSyncData;
}

export interface ConversationHistoryMessage extends WebSocketMessage {
  type: 'conversation_history';
  history: ConversationEntry[];
}

export interface HistoryClearedMessage extends WebSocketMessage {
  type: 'history_cleared';
  message: string;
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  message: string;
}

export interface PingMessage extends WebSocketMessage {
  type: 'ping';
}

export interface PongMessage extends WebSocketMessage {
  type: 'pong';
}

// Lip Sync Data Types
export interface LipSyncData {
  type: 'visemes';
  visemes: string[];
  timing: PhonemeTiming[];
  duration: number;
  language: string;
  text: string;
  word_count: number;
}

export interface PhonemeTiming {
  phoneme: string;
  start_time: number;
  duration: number;
}

// Conversation Types
export interface ConversationEntry {
  timestamp: string;
  user_input: string;
  ai_response: string;
  type: 'voice' | 'text';
}

// API Response Types
export interface V2VApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    detail: string;
  };
}

// WebSocket Connection States
export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error';

// V2V Service Configuration
export interface V2VConfig {
  websocketUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  pingInterval: number;
}

// Audio Recording Configuration
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitRate: number;
  format: 'webm' | 'wav' | 'mp3';
}

// Voice Processing States
export type VoiceProcessingState = 'idle' | 'recording' | 'processing' | 'playing' | 'error';

// Event Handlers
export type VoiceEventHandler = (data: any) => void;
export type ErrorEventHandler = (error: Error) => void;
export type ConnectionEventHandler = (state: WebSocketState) => void;
