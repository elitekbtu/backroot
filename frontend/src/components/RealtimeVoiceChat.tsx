import React, { useState, useRef, useEffect, useCallback } from 'react';

interface RealtimeVoiceChatProps {
  userId: string;
  apiBaseUrl?: string;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const RealtimeVoiceChat: React.FC<RealtimeVoiceChatProps> = ({ 
  userId, 
  apiBaseUrl = 'ws://localhost:8000' 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // const [currentResponse, setCurrentResponse] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // WebSocket connection with auto-reconnect
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${apiBaseUrl}/api/v1/voice/ws/v2v/${userId}`;
    console.log('Connecting to:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket Connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        addMessage('Connected to AI', 'ai');
      };

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket Disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsRecording(false);
        setIsProcessing(false);
        
        // Auto-reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [userId, apiBaseUrl]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_status':
        console.log('Connection status:', message.message);
        break;
        
      case 'processing_status':
        setIsProcessing(message.status === 'processing');
        break;
        
      case 'voice_response':
        // Add user message
        addMessage(message.transcript, 'user');
        // Add AI response
        addMessage(message.ai_response, 'ai');
        // setCurrentResponse('');
        
        // Play audio response
        if (message.audio_response) {
          playAudioResponse(message.audio_response);
        }
        setIsProcessing(false);
        break;
        
      case 'error':
        console.error('WebSocket error:', message.message);
        setIsProcessing(false);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Add message to chat
  const addMessage = (content: string, type: 'user' | 'ai') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Play audio response
  const playAudioResponse = async (audioBase64: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioData = atob(audioBase64);
      const audioBuffer = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioBuffer[i] = audioData.charCodeAt(i);
      }

      const audioBufferDecoded = await audioContextRef.current.decodeAudioData(audioBuffer.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferDecoded;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!isConnected || isRecording) return;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported. Please use HTTPS or localhost.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      // Try to use WAV format first, fallback to WebM
      let mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm;codecs=opus';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await sendAudioData(audioBlob, mimeType);
        setIsProcessing(true);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Send audio data
  const sendAudioData = async (audioBlob: Blob, mimeType: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Convert to WAV format if needed
      let processedBlob = audioBlob;
      if (mimeType.includes('webm')) {
        processedBlob = await convertToWav(audioBlob);
      }

      const reader = new FileReader();
      reader.onload = () => {
        const audioData = reader.result as string;
        const base64Audio = audioData.split(',')[1];
        
        const message = {
          type: 'voice_input',
          audio_data: base64Audio,
          audio_format: 'wav'
        };
        
        wsRef.current!.send(JSON.stringify(message));
      };
      reader.readAsDataURL(processedBlob);
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  // Convert WebM to WAV
  const convertToWav = async (webmBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();
      
      fileReader.onload = async () => {
        try {
          const arrayBuffer = fileReader.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convert to WAV
          const wavBlob = audioBufferToWav(audioBuffer);
          resolve(wavBlob);
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.readAsArrayBuffer(webmBlob);
    });
  };

  // Convert AudioBuffer to WAV Blob
  const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Auto-connect on mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [connectWebSocket, disconnectWebSocket]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">GPT-4o Realtime Chat</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Подключено' : 'Отключено'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-4">🎤</div>
            <p className="text-lg font-semibold">Нажмите "Начать разговор"</p>
            <p className="text-sm text-gray-600">Реальное время с GPT-4o Realtime API</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                <span className="text-sm">AI думает...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex items-center justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isConnected || isProcessing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
              isRecording
                ? 'bg-red-500 scale-110 shadow-lg animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600 shadow-md'
            } ${!isConnected || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <p className="text-center text-sm text-gray-600 mt-2 font-medium">
          {isRecording ? 'Говорите в реальном времени...' : 'Начать разговор'}
        </p>
        {isRecording && (
          <p className="text-center text-xs text-blue-600 mt-1">
            ✨ GPT-4o Realtime API
          </p>
        )}
      </div>
    </div>
  );
};

export default RealtimeVoiceChat;