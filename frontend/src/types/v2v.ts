// V2V (Voice-to-Voice) Types - Simplified

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

// WebSocket Connection States
export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error';

// Voice Processing States
export type VoiceProcessingState = 'idle' | 'recording' | 'processing' | 'playing' | 'error';

// Lip Sync and Avatar Types
export interface VisemeData {
  viseme: string;
  start_time: number;
  duration: number;
}

export interface LipSyncData {
  visemes: string[];
  times: number[];
  durations: number[];
  timing?: VisemeData[]; // Alternative format for phoneme timing
}

export interface AvatarConfig {
  url: string;
  body?: 'M' | 'F';
  lipsyncLang?: string;
  ttsLang?: string;
  ttsVoice?: string;
  avatarMood?: string;
  avatarMute?: boolean;
  avatarIdleEyeContact?: number;
  avatarIdleHeadMove?: number;
  avatarSpeakingEyeContact?: number;
  avatarSpeakingHeadMove?: number;
}

// API Response Types
export interface V2VApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    detail: string;
  };
}