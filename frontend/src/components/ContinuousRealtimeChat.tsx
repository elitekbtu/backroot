import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  isAudio?: boolean;
}

interface RealtimeEvent {
  type: string;
  status?: string;
  message?: string;
  audio_data?: string;
  content?: string;
  session_id?: string;
  error?: string;
  format?: string;
}

const ContinuousRealtimeChat: React.FC = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState('Отключено');
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const connectionAttemptRef = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // const audioContextRef = useRef<AudioContext | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Подключение к WebSocket
  const connectWebSocket = useCallback(() => {
    console.log('connectWebSocket called, current state:', {
      hasWebSocket: !!wsRef.current,
      readyState: wsRef.current?.readyState,
      isConnecting,
      userId: user?.id
    });
    
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting || isConnectingRef.current) {
      console.log('WebSocket already connected or connecting, skipping', {
        readyState: wsRef.current?.readyState,
        isConnecting,
        isConnectingRef: isConnectingRef.current
      });
      return;
    }
    if (!user?.id) {
      console.error('User not authenticated');
      setStatus('Не авторизован');
      return;
    }

    // Clean up any existing connection
    if (wsRef.current) {
      console.log('Cleaning up existing WebSocket connection, readyState:', wsRef.current.readyState);
      wsRef.current.close();
      wsRef.current = null;
    }

    const attemptId = ++connectionAttemptRef.current;
    console.log('Starting connection attempt:', attemptId);
    
    isConnectingRef.current = true;
    setIsConnecting(true);
    setStatus('Подключение...');

    try {
      const wsUrl = `ws://46.101.187.24:8000/api/v1/realtime/ws/${user.id}/audio`;
      console.log('🔌 Attempting to connect to:', wsUrl, 'attempt:', attemptId);
      console.log('WebSocket constructor called, attempt:', attemptId);
      wsRef.current = new WebSocket(wsUrl);
      console.log('WebSocket created, readyState:', wsRef.current.readyState, 'attempt:', attemptId);

      // Set a timeout to detect connection issues
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.error('WebSocket connection timeout');
          wsRef.current.close();
          setStatus('Таймаут подключения');
          setIsConnecting(false);
        }
      }, 10000); // 10 second timeout

      wsRef.current.onopen = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🟢 Realtime WebSocket connected', event, 'attempt:', attemptId);
        console.log('WebSocket readyState:', wsRef.current?.readyState, 'attempt:', attemptId);
        console.log('WebSocket URL:', wsRef.current?.url, 'attempt:', attemptId);
        
        // Double-check the WebSocket is still valid
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          isConnectingRef.current = false;
          setIsConnected(true);
          setIsConnecting(false);
          setReconnectAttempts(0);
          setStatus('Подключено');
          console.log('Connection successful for attempt:', attemptId);
        } else {
          isConnectingRef.current = false;
          console.error('WebSocket connection lost immediately after open event, attempt:', attemptId);
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
        console.log('🔴 Realtime WebSocket disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          type: event.type,
          attempt: attemptId
        });
        isConnectingRef.current = false;
        setIsConnected(false);
        setIsConnecting(false);
        setStatus('Отключено');
        
        // Only reconnect if it wasn't a clean close
        if (event.code !== 1000) {
          console.log('🔄 Scheduling reconnect due to abnormal close, attempt:', attemptId);
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error, 'attempt:', attemptId);
        console.error('WebSocket readyState:', wsRef.current?.readyState, 'attempt:', attemptId);
        console.error('WebSocket URL:', wsRef.current?.url, 'attempt:', attemptId);
        isConnectingRef.current = false;
        setIsConnecting(false);
        setStatus('Ошибка соединения');
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error, 'attempt:', attemptId);
      isConnectingRef.current = false;
      setIsConnecting(false);
      scheduleReconnect();
    }
  }, [user?.id]);

  // Автоматическое переподключение
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Simple backoff: 2s, 5s, 10s, max 30s
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
  }, [reconnectAttempts]);

  // Отключение от WebSocket
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
    setIsConnecting(false);
    setStatus('Отключено');
  }, []);

  // Обработка realtime событий
  const handleRealtimeEvent = (event: RealtimeEvent) => {
    console.log('📨 Realtime event:', event);

    switch (event.type) {
      case 'session_created':
        setSessionId(event.session_id || null);
        setStatus('Сессия создана');
        break;

      case 'status':
        setStatus(event.message || 'Обработка...');
        if (event.status === 'ai_thinking') {
          setIsProcessing(true);
        } else if (event.status === 'ready') {
          setIsProcessing(false);
        }
        break;

      case 'audio':
        if (event.audio_data) {
          playAudioResponse(event.audio_data, event.format || 'mp3');
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

  // Добавление сообщения
  const addMessage = (content: string, type: 'user' | 'ai') => {
    const message: Message = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  // Воспроизведение аудио ответа
  const playAudioResponse = async (audioBase64: string, format: string = 'mp3') => {
    try {
      // Создаем аудио элемент для воспроизведения
      const audio = new Audio();
      audio.src = `data:audio/${format};base64,${audioBase64}`;
      
      // Воспроизводим аудио
      await audio.play();
      
      console.log(`🔊 Playing ${format} audio response`);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // НЕПРЕРЫВНАЯ запись
  const startRecording = async () => {
    if (!isConnected || !sessionId) {
      console.error('Not connected or no session');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      // Try different audio formats in order of reliability and OpenAI compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/wav';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/ogg;codecs=opus';
          }
        }
      }
      
      console.log('Using audio format:', mimeType);

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk received, size:', event.data.size, 'total chunks:', audioChunksRef.current.length);
        }
      };

      // НЕПРЕРЫВНАЯ запись - НЕ ОСТАНАВЛИВАЕМ!
      mediaRecorderRef.current.start(1000); // Получаем данные каждую секунду
      setIsRecording(true);
      setStatus('НЕПРЕРЫВНО слушаю...');
      
      // Отправляем накопленное аудио каждые 3 секунды
      const sendInterval = setInterval(async () => {
        if (audioChunksRef.current.length > 0) {
          console.log('Sending accumulated audio, chunks:', audioChunksRef.current.length);
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await sendAudioData(audioBlob);
          audioChunksRef.current = []; // Очищаем буфер
        }
      }, 3000);
      
      // Сохраняем интервал для очистки
      (mediaRecorderRef.current as any).sendInterval = sendInterval;

    } catch (error) {
      console.error('Error starting recording:', error);
      setStatus('Ошибка доступа к микрофону');
    }
  };

  // Остановить НЕПРЕРЫВНУЮ запись
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Очищаем интервал отправки
      const sendInterval = (mediaRecorderRef.current as any).sendInterval;
      if (sendInterval) {
        clearInterval(sendInterval);
      }
      
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setStatus('Остановлено');
    }
  };

  // Отправка аудио данных
  const sendAudioData = async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !sessionId) {
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const audioData = reader.result as string;
        const base64Audio = audioData.split(',')[1];
        
        // Determine the correct format from the blob's MIME type
        let format = 'webm';
        if (audioBlob.type.includes('webm')) {
          format = 'webm';
        } else if (audioBlob.type.includes('wav')) {
          format = 'wav';
        } else if (audioBlob.type.includes('ogg')) {
          format = 'ogg';
        } else if (audioBlob.type.includes('mp4')) {
          format = 'mp4';
        }
        
        console.log('Sending audio with format:', format, 'MIME type:', audioBlob.type);
        
        const message = {
          type: 'audio',
          session_id: sessionId,
          audio_data: base64Audio,
          format: format
        };
        
        wsRef.current!.send(JSON.stringify(message));
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  // Подключение при монтировании
  useEffect(() => {
    if (user?.id) {
      // Add a small delay to prevent race conditions
      const timeoutId = setTimeout(() => {
        connectWebSocket();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        disconnectWebSocket();
      };
    }
  }, [user?.id]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            🚀 НЕПРЕРЫВНЫЙ Realtime Chat
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">{status}</span>
            </div>
            <div className="flex space-x-2">
              {!isConnected && !isConnecting && (
                <button
                  onClick={connectWebSocket}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Подключиться
                </button>
              )}
              {isConnected && (
                <button
                  onClick={disconnectWebSocket}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Отключиться
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-4">🚀</div>
            <p className="text-lg font-semibold">НЕПРЕРЫВНОЕ соединение готово!</p>
            <p className="text-sm text-gray-600">Нажмите микрофон и говорите в реальном времени</p>
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
                <span className="text-sm">AI думает в реальном времени...</span>
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
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 ${
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
          {isRecording ? '🚀 НЕПРЕРЫВНО слушаю - говорите без остановки!' : 'Начать НЕПРЕРЫВНЫЙ разговор'}
        </p>
        {isRecording && (
          <div className="text-center text-xs text-blue-600 mt-1 space-y-1">
            <p>✨ GPT-4o Realtime API - НЕПРЕРЫВНОЕ соединение</p>
            <p>🎤 Отправка каждые 2 секунды - НЕ ОСТАНАВЛИВАЙТЕСЬ!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinuousRealtimeChat;