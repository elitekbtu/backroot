import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

interface RealtimeEvent {
  type: string;
  content?: string;
  audio_data?: string;
  format?: string;
  status?: string;
  error?: string;
  session_id?: string;
  message?: string;
}

const OptimizedRealtimeChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Отключено');
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const connectionAttemptRef = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    console.log('🔌 Optimized WebSocket connection attempt');
    
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnectingRef.current) {
      console.log('WebSocket already connected or connecting, skipping');
      return;
    }
    
    if (!user?.id) {
      console.error('User not authenticated');
      setStatus('Не авторизован');
      return;
    }

    // Clean up any existing connection
    if (wsRef.current) {
      console.log('Cleaning up existing WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
    }

    const attemptId = ++connectionAttemptRef.current;
    console.log('Starting optimized connection attempt:', attemptId);
    
    isConnectingRef.current = true;
    setStatus('Подключение к OpenAI Realtime API...');

    try {
      const wsUrl = `ws://localhost:8000/api/v1/realtime-optimized/ws/${user.id}/audio`;
      console.log('🔌 Attempting to connect to:', wsUrl, 'attempt:', attemptId);
      
      wsRef.current = new WebSocket(wsUrl);
      
      // Set a timeout to detect connection issues
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.error('WebSocket connection timeout');
          wsRef.current.close();
          setStatus('Таймаут подключения');
          isConnectingRef.current = false;
        }
      }, 10000);

      wsRef.current.onopen = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🟢 Optimized Realtime WebSocket connected', event, 'attempt:', attemptId);
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          isConnectingRef.current = false;
          setIsConnected(true);
          setReconnectAttempts(0);
          setStatus('Подключено к OpenAI Realtime API');
          console.log('Optimized connection successful for attempt:', attemptId);
        } else {
          isConnectingRef.current = false;
          console.error('WebSocket connection lost immediately after open event');
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🔴 Optimized Realtime WebSocket disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          attempt: attemptId
        });
        isConnectingRef.current = false;
        setIsConnected(false);
        setStatus('Отключено');
        
        // Only reconnect if it wasn't a clean close
        if (event.code !== 1000) {
          console.log('🔄 Scheduling reconnect due to abnormal close');
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error, 'attempt:', attemptId);
        isConnectingRef.current = false;
        setStatus('Ошибка соединения');
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error, 'attempt:', attemptId);
      isConnectingRef.current = false;
      scheduleReconnect();
    }
  }, [user?.id]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const maxAttempts = 5;
    if (reconnectAttempts >= maxAttempts) {
      console.log('❌ Max reconnection attempts reached');
      setStatus('Не удалось подключиться');
      return;
    }
    
    const delays = [2000, 5000, 10000, 20000, 30000];
    const delay = delays[Math.min(reconnectAttempts, delays.length - 1)];
    setReconnectAttempts(prev => prev + 1);
    
    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 Attempting to reconnect... (attempt ${reconnectAttempts + 1})`);
      connectWebSocket();
    }, delay);
  }, [reconnectAttempts, connectWebSocket]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setStatus('Отключено');
  }, []);

  const handleRealtimeEvent = (event: RealtimeEvent) => {
    console.log('📨 Optimized Realtime event:', event);

    switch (event.type) {
      case 'session_created':
        setSessionId(event.session_id || null);
        setStatus('Сессия создана с OpenAI Realtime API');
        break;

      case 'status':
        setStatus(event.message || 'Обработка...');
        if (event.status === 'speech_started') {
          setStatus('🎤 Речь обнаружена...');
        } else if (event.status === 'speech_stopped') {
          setStatus('⏹️ Речь завершена, обработка...');
        } else if (event.status === 'response_completed') {
          setStatus('✅ Ответ готов');
        }
        break;

      case 'audio':
        if (event.audio_data) {
          playAudioResponse(event.audio_data, event.format || 'pcm16');
        }
        break;

      case 'text':
        if (event.content) {
          addMessage(event.content, 'ai');
        }
        break;

      case 'error':
        console.error('Realtime error:', event.error);
        setStatus(`Ошибка: ${event.error}`);
        break;
    }
  };

  const addMessage = (content: string, type: 'user' | 'ai') => {
    const message: Message = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const playAudioResponse = async (audioBase64: string, format: string = 'pcm16') => {
    try {
      // For PCM16, we need to convert to WAV format
      const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      await audio.play();
      console.log(`🔊 Playing ${format} audio response`);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      // Use PCM16 format for better compatibility with OpenAI Realtime API
      const mimeType = 'audio/webm;codecs=opus';
      console.log('Using audio format:', mimeType);

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk received, size:', event.data.size);
          
          // Send audio data immediately for real-time processing
          if (audioChunksRef.current.length >= 3) { // Send every 3 chunks (about 300ms)
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
            if (audioBlob.size > 5000) { // Minimum size check
              console.log('Sending real-time audio data');
              await sendAudioData(audioBlob);
              
              // Auto-commit and create response
              setTimeout(() => {
                commitAudio();
                setTimeout(() => {
                  createResponse();
                }, 200);
              }, 500);
              
              audioChunksRef.current = []; // Clear buffer
            }
          }
        }
      };

      // Start recording with smaller chunks for real-time processing
      mediaRecorderRef.current.start(100); // 100ms chunks
      setIsRecording(true);
      setStatus('🎤 Записываю аудио...');

    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('Ошибка доступа к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setStatus('Остановлено');
    }
  };

  const sendAudioData = async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !sessionId) {
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const audioData = reader.result as string;
        const base64Audio = audioData.split(',')[1];
        
        const message = {
          type: 'audio',
          session_id: sessionId,
          audio_data: base64Audio
        };
        
        wsRef.current!.send(JSON.stringify(message));
        console.log('Sent audio data to optimized realtime API');
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  const commitAudio = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionId) {
      wsRef.current.send(JSON.stringify({
        type: 'commit_audio',
        session_id: sessionId
      }));
      console.log('Committed audio buffer');
    }
  };

  const createResponse = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionId) {
      wsRef.current.send(JSON.stringify({
        type: 'create_response',
        session_id: sessionId
      }));
      console.log('Requested response creation');
    }
  };

  // Auto-commit and create response when recording stops
  useEffect(() => {
    if (!isRecording && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      // Check if we have enough audio (at least 1 second)
      if (audioBlob.size > 10000) { // Rough estimate for 1 second of audio
        sendAudioData(audioBlob);
        
        // Commit audio and create response after a short delay
        setTimeout(() => {
          commitAudio();
          setTimeout(() => {
            createResponse();
          }, 500);
        }, 1000);
      } else {
        console.log('Not enough audio data, skipping send');
      }
      
      audioChunksRef.current = [];
    }
  }, [isRecording, sessionId]);

  // Connection on mount
  useEffect(() => {
    if (user?.id) {
      const timeoutId = setTimeout(() => {
        connectWebSocket();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        disconnectWebSocket();
      };
    }
  }, [user?.id, connectWebSocket, disconnectWebSocket]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          🚀 ОПТИМИЗИРОВАННОЕ соединение готово!
        </h1>
        
        <p className="text-center text-gray-600 mb-6">
          Использует настоящий OpenAI Realtime API для максимальной производительности
        </p>

        {/* Status */}
        <div className="text-center mb-6">
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status}
          </div>
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto border rounded-lg p-4 mb-6 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">Сообщения появятся здесь...</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-100 ml-8'
                    : 'bg-green-100 mr-8'
                }`}
              >
                <div className="font-medium text-sm text-gray-600 mb-1">
                  {message.type === 'user' ? 'Вы' : 'AI'}
                </div>
                <div className="text-gray-800">{message.content}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-200 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>

          <div className="text-center text-sm text-gray-600">
            <p>🎤 Нажмите микрофон и говорите</p>
            <p>✨ OpenAI Realtime API - НЕПРЕРЫВНОЕ соединение</p>
            <p>🚀 Автоматическая обработка речи</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={connectWebSocket}
              disabled={isConnected}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
            >
              Подключить
            </button>
            <button
              onClick={disconnectWebSocket}
              disabled={!isConnected}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
            >
              Отключить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedRealtimeChat;