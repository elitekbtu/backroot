import React, { useState, useEffect } from 'react';
import { v2vService } from '../api/v2v';
import { useAuth } from '../context/AuthContext';
import TalkingHead from '../components/TalkingHead';
import type { 
  VoiceResponseMessage, 
  WebSocketState, 
  VoiceProcessingState,
  ConversationEntry,
  VoiceServiceStatus,
  ModelTestResults
} from '../api/v2v';
import type { AvatarConfig, LipSyncData } from '../types/v2v';

const V2V: React.FC = () => {
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState<WebSocketState>('disconnected');
  const [processingState, setProcessingState] = useState<VoiceProcessingState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<VoiceServiceStatus | null>(null);
  const [modelTestResults, setModelTestResults] = useState<ModelTestResults | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Avatar-related state
  const [avatarReady, setAvatarReady] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [currentLipSyncData, setCurrentLipSyncData] = useState<LipSyncData | null>(null);
  const [avatarMood, setAvatarMood] = useState<string>('neutral');
  
  const userId = user?.id?.toString() || 'anonymous';

  // Avatar configuration
  const avatarConfig: AvatarConfig = {
    url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png',
    body: 'F',
    lipsyncLang: 'en',
    ttsLang: 'en-US',
    ttsVoice: 'en-US-Standard-A',
    avatarMood: avatarMood,
    avatarMute: false,
    avatarIdleEyeContact: 0.3,
    avatarIdleHeadMove: 0.5,
    avatarSpeakingEyeContact: 0.7,
    avatarSpeakingHeadMove: 0.3
  };

  // Initialize V2V service
  useEffect(() => {
    const initializeService = async () => {
      try {
        console.log('Initializing V2V service for user:', userId);

        // Set up event handlers
        v2vService.setOnConnectionChange((state) => {
          console.log('Connection state changed:', state);
          setConnectionState(state);
          if (state === 'error') {
            setError('Ошибка подключения к сервису');
          } else if (state === 'connected') {
            setError(null);
          }
        });

        v2vService.setOnVoiceResponse((response: VoiceResponseMessage) => {
          console.log('Voice response received:', response);
          
          // Add to conversation history
          setConversationHistory(prev => [...prev, {
            timestamp: response.timestamp,
            user_input: response.transcript,
            ai_response: response.ai_response,
            type: 'voice'
          }]);

          // Set avatar mood based on response content (simple sentiment analysis)
          const responseText = response.ai_response.toLowerCase();
          if (responseText.includes('happy') || responseText.includes('great') || responseText.includes('wonderful')) {
            setAvatarMood('happy');
          } else if (responseText.includes('sad') || responseText.includes('sorry') || responseText.includes('unfortunately')) {
            setAvatarMood('sad');
          } else if (responseText.includes('angry') || responseText.includes('frustrated')) {
            setAvatarMood('angry');
          } else {
            setAvatarMood('neutral');
          }
          
          // Create simple lip sync data from response text
          // In a real implementation, this would come from the TTS service
          const words = response.ai_response.split(' ');
          const lipSyncData: LipSyncData = {
            visemes: [],
            times: [],
            durations: [],
            timing: []
          };
          
          let currentTime = 0;
          words.forEach((word, index) => {
            const duration = word.length * 0.1; // Simple duration calculation
            lipSyncData.visemes.push(index % 2 === 0 ? 'aa' : 'E'); // Alternate between vowels
            lipSyncData.times.push(currentTime);
            lipSyncData.durations.push(duration);
            lipSyncData.timing!.push({
              viseme: index % 2 === 0 ? 'aa' : 'E',
              start_time: currentTime,
              duration: duration
            });
            currentTime += duration + 0.05; // Small gap between words
          });
          
          setCurrentLipSyncData(lipSyncData);

          // Play the audio response
          v2vService.playAudioResponse(response.audio_response);
          
          // Clear lip sync data after estimated speech duration
          setTimeout(() => {
            setCurrentLipSyncData(null);
          }, currentTime * 1000);
        });

        v2vService.setOnProcessingStatus((status) => {
          console.log('Processing status:', status);
          setProcessingState(status.status === 'processing' ? 'processing' : 'idle');
        });

        v2vService.setOnError((error) => {
          console.error('V2V Error:', error);
          setError(error.message);
        });

        v2vService.setOnConversationHistory((response) => {
          console.log('Conversation history received:', response);
          setConversationHistory(response.history);
        });

        // Get service status
        const statusResponse = await v2vService.getServiceStatus();
        if (statusResponse.success && statusResponse.data) {
          setServiceStatus(statusResponse.data);
          console.log('Service status:', statusResponse.data);
        }

        // Test models
        const modelsResponse = await v2vService.testModels();
        if (modelsResponse.success && modelsResponse.data) {
          setModelTestResults(modelsResponse.data);
          console.log('Model test results:', modelsResponse.data);
        }

        // Connect to V2V service
        const connected = await v2vService.connect(userId);
        if (connected) {
          console.log('Successfully connected to V2V service');
          setIsInitialized(true);
        } else {
          throw new Error('Failed to connect to V2V service');
        }

      } catch (error) {
        console.error('Failed to initialize V2V service:', error);
        setError('Не удалось инициализировать сервис голосового общения');
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up V2V service');
      v2vService.disconnect();
    };
  }, [userId]);

  // Avatar handlers
  const handleAvatarReady = () => {
    setAvatarReady(true);
    setAvatarError(null);
    console.log('Avatar is ready!');
  };

  const handleAvatarError = (error: Error) => {
    setAvatarError(error.message);
    setAvatarReady(false);
    console.error('Avatar error:', error);
  };

  const handleStartRecording = async () => {
    try {
      const success = await v2vService.startRecording();
      if (success) {
        setIsRecording(true);
        setError(null);
      } else {
        setError('Не удалось начать запись');
      }
    } catch (error) {
      setError('Ошибка при запуске записи');
    }
  };

  const handleStopRecording = () => {
    v2vService.stopRecording();
    setIsRecording(false);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const success = v2vService.sendTextInput(textInput.trim());
      if (success) {
        setTextInput('');
        setError(null);
      } else {
        setError('Не удалось отправить сообщение');
      }
    }
  };

  const handleClearHistory = () => {
    const success = v2vService.clearConversationHistory();
    if (success) {
      setConversationHistory([]);
    }
  };

  const handleRequestHistory = () => {
    v2vService.requestConversationHistory();
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-gray-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getProcessingStatusColor = () => {
    switch (processingState) {
      case 'idle': return 'text-gray-500';
      case 'recording': return 'text-red-500';
      case 'processing': return 'text-yellow-500';
      case 'playing': return 'text-blue-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '⚪';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getProcessingIcon = () => {
    switch (processingState) {
      case 'idle': return '⏸️';
      case 'recording': return '🔴';
      case 'processing': return '⏳';
      case 'playing': return '🔊';
      case 'error': return '❌';
      default: return '⏸️';
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Инициализация голосового сервиса...</p>
          {error && (
            <p className="text-red-600 mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Voice to Voice AI</h1>
          <p className="text-gray-600">Общайтесь с ИИ через голос в реальном времени</p>
        </div>

        {/* Service Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Статус сервиса</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getStatusIcon()}</span>
              <div>
                <div className={`font-medium ${getConnectionStatusColor()}`}>
                  Подключение: {connectionState}
                </div>
                <div className="text-sm text-gray-600">
                  {serviceStatus ? `${serviceStatus.active_connections} активных соединений` : 'Загрузка...'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getProcessingIcon()}</span>
              <div>
                <div className={`font-medium ${getProcessingStatusColor()}`}>
                  Обработка: {processingState}
                </div>
                <div className="text-sm text-gray-600">
                  {isRecording ? 'Запись активна' : 'Готов к работе'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-medium text-gray-700">
                  Модели ИИ
                </div>
                <div className="text-sm text-gray-600">
                  {modelTestResults ? 
                    `${Object.values(modelTestResults).filter(Boolean).length}/3 работают` : 
                    'Проверка...'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Avatar Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">AI Avatar</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TalkingHead
                className="w-full"
                onReady={handleAvatarReady}
                onError={handleAvatarError}
                lipSyncData={currentLipSyncData}
                isPlaying={processingState === 'playing'}
                avatarConfig={avatarConfig}
                mood={avatarMood}
                options={{
                  cameraView: 'upper',
                  lightAmbientIntensity: 2,
                  lightDirectIntensity: 30,
                  avatarIdleEyeContact: 0.3,
                  avatarIdleHeadMove: 0.5,
                  avatarSpeakingEyeContact: 0.7,
                  avatarSpeakingHeadMove: 0.3
                }}
              />
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Avatar Status</h3>
                <div className="space-y-2">
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    avatarReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {avatarReady ? '✅ Ready' : '⏳ Loading...'}
                  </div>
                  {avatarError && (
                    <div className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                      ❌ {avatarError}
                    </div>
                  )}
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    processingState === 'playing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {processingState === 'playing' ? '🗣️ Speaking' : '😐 Silent'}
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    😊 {avatarMood.charAt(0).toUpperCase() + avatarMood.slice(1)}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Avatar Features</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✅ Ready Player Me</li>
                  <li>✅ Lip Sync</li>
                  <li>✅ Mood Expressions</li>
                  <li>✅ Eye Contact</li>
                  <li>✅ Idle Animations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Голосовое управление</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex space-x-4">
              <button
                onClick={handleStartRecording}
                disabled={!v2vService.isConnected || isRecording || processingState === 'processing' || processingState === 'playing'}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
              >
                <span className="text-xl">{isRecording ? '🔴' : '🎤'}</span>
                <span>{isRecording ? 'Запись...' : 'Начать запись'}</span>
              </button>
              
              <button
                onClick={handleStopRecording}
                disabled={!isRecording}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
              >
                <span className="text-xl">⏹️</span>
                <span>Остановить</span>
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Идет запись...</span>
                </div>
              )}
              {processingState === 'processing' && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span>Обработка...</span>
                </div>
              )}
              {processingState === 'playing' && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Воспроизведение...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Текстовый ввод</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Введите ваше сообщение..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              disabled={!v2vService.isConnected || processingState === 'processing' || processingState === 'playing'}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!v2vService.isConnected || !textInput.trim() || processingState === 'processing' || processingState === 'playing'}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>📤</span>
              <span>Отправить</span>
            </button>
          </div>
        </div>

        {/* Conversation History */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">История разговора</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleRequestHistory}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                🔄 Обновить
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                🗑️ Очистить
              </button>
            </div>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversationHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <p>Пока нет разговоров</p>
                <p className="text-sm">Начните говорить или введите сообщение</p>
              </div>
            ) : (
              conversationHistory.map((entry, index) => (
                <div key={index} className="border-l-4 border-yellow-500 pl-4 py-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <span>{entry.type === 'voice' ? '🎤' : '📝'}</span>
                    <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 font-medium">Вы:</span>
                      <span className="text-gray-800">{entry.user_input}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 font-medium">ИИ:</span>
                      <span className="text-gray-800">{entry.ai_response}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Service Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Информация о сервисе</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>WebSocket URL:</strong> ws://localhost:8000/api/v1/voice/ws/v2v/{userId}
            </div>
            <div>
              <strong>Пользователь:</strong> {user?.username || 'Анонимный'}
            </div>
            <div>
              <strong>Формат аудио:</strong> WebM/Opus
            </div>
            <div>
              <strong>Частота дискретизации:</strong> 16kHz
            </div>
            <div>
              <strong>Статус OpenAI API:</strong> 
              <span className={`ml-2 ${serviceStatus?.openai_api_key_valid ? 'text-green-600' : 'text-red-600'}`}>
                {serviceStatus?.openai_api_key_valid ? '✅ Активен' : '❌ Неактивен'}
              </span>
            </div>
            <div>
              <strong>Активные сессии:</strong> {serviceStatus?.active_sessions || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default V2V;