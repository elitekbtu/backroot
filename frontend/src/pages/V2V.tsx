import React, { useState, useEffect } from 'react';
import { v2vService } from '../api/v2v';
import { useAuth } from '../context/AuthContext';
import TalkingHead from '../components/TalkingHead';
import AvatarLibrary from '../components/AvatarLibrary';
import type { 
  VoiceResponseMessage, 
  WebSocketState, 
  VoiceProcessingState,
  ConversationEntry,
  VoiceServiceStatus,
  ModelTestResults,
  LipSyncData
} from '../types/v2v';

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
  const [currentLipSyncData, setCurrentLipSyncData] = useState<LipSyncData | null>(null);
  const [avatarMood, setAvatarMood] = useState<string>('neutral');
  const [showAvatar, setShowAvatar] = useState<boolean>(true);
  const [showAvatarLibrary, setShowAvatarLibrary] = useState<boolean>(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>('');
  
  const userId = user?.id?.toString() || 'anonymous';

  // Initialize V2V service
  useEffect(() => {
    const initializeService = async () => {
      try {
        // Set up event handlers
        v2vService.setOnConnectionChange((state) => {
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

          // Set lip-sync data for avatar
          if (response.lip_sync_data) {
            setCurrentLipSyncData(response.lip_sync_data);
          }

          // Play the audio response
          v2vService.playAudioResponse(response.audio_response);
        });

        v2vService.setOnProcessingStatus((status) => {
          setProcessingState(status.status === 'processing' ? 'processing' : 'idle');
        });

        v2vService.setOnError((error) => {
          setError(error.message);
          console.error('V2V Error:', error);
        });

        v2vService.setOnConversationHistory((response) => {
          setConversationHistory(response.history);
        });

        v2vService.setOnLipSyncData((response) => {
          if (response.lip_sync_data) {
            setCurrentLipSyncData(response.lip_sync_data);
          }
        });

        // Get service status
        const statusResponse = await v2vService.getServiceStatus();
        if (statusResponse.success && statusResponse.data) {
          setServiceStatus(statusResponse.data);
        }

        // Test models
        const modelsResponse = await v2vService.testModels();
        if (modelsResponse.success && modelsResponse.data) {
          setModelTestResults(modelsResponse.data);
        }

        // Connect to V2V service
        await v2vService.connect(userId);
        setIsInitialized(true);

      } catch (error) {
        console.error('Failed to initialize V2V service:', error);
        setError('Не удалось инициализировать сервис голосового общения');
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      v2vService.disconnect();
    };
  }, [userId]);

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
      v2vService.sendTextInput(textInput.trim());
      setTextInput('');
    }
  };

  const handleClearHistory = () => {
    v2vService.clearConversationHistory();
    setConversationHistory([]);
  };

  const handleRequestHistory = () => {
    v2vService.requestConversationHistory();
  };

  const handleRequestLipSync = () => {
    if (textInput.trim()) {
      v2vService.requestLipSyncData(textInput.trim());
    }
  };

  const handleLoadAvatar = (avatarUrl: string) => {
    setCurrentAvatarUrl(avatarUrl);
    setShowAvatarLibrary(false);
    console.log('Loading avatar:', avatarUrl);
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
          <p className="text-gray-600">Общайтесь с ИИ через голос в реальном времени с 3D аватаром</p>
        </div>

        {/* Avatar Section */}
        {showAvatar && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">3D Аватар</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAvatarLibrary(true)}
                  className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                >
                  📚 Библиотека
                </button>
                <select
                  value={avatarMood}
                  onChange={(e) => setAvatarMood(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="neutral">😐 Нейтральный</option>
                  <option value="happy">😊 Радостный</option>
                  <option value="sad">😢 Грустный</option>
                  <option value="angry">😠 Сердитый</option>
                </select>
                <button
                  onClick={() => setShowAvatar(false)}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                >
                  Скрыть
                </button>
              </div>
            </div>
            
            <TalkingHead
              className="w-full"
              lipSyncData={currentLipSyncData}
              isPlaying={processingState === 'playing'}
              mood={avatarMood}
              avatarUrl={currentAvatarUrl}
              onReady={() => console.log('Avatar ready')}
              onError={(error) => setError(`Avatar error: ${error.message}`)}
            />
          </div>
        )}

        {/* Avatar Library Modal */}
        {showAvatarLibrary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Библиотека 3D Аватаров</h2>
                  <button
                    onClick={() => setShowAvatarLibrary(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <AvatarLibrary onAvatarSelect={handleLoadAvatar} />
              </div>
            </div>
          </div>
        )}

        {/* Show Avatar Button */}
        {!showAvatar && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
            <button
              onClick={() => setShowAvatar(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 mx-auto"
            >
              <span>👤</span>
              <span>Показать 3D Аватар</span>
            </button>
          </div>
        )}

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

        {/* Voice Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Голосовое управление</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex space-x-4">
              <button
                onClick={handleStartRecording}
                disabled={!v2vService.isConnected || isRecording || processingState === 'processing'}
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
          <div className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Введите ваше сообщение..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                disabled={!v2vService.isConnected || processingState === 'processing'}
              />
              <button
                onClick={handleTextSubmit}
                disabled={!v2vService.isConnected || !textInput.trim() || processingState === 'processing'}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>📤</span>
                <span>Отправить</span>
              </button>
            </div>
            
            {/* Lip-sync Test */}
            <div className="flex space-x-2">
              <button
                onClick={handleRequestLipSync}
                disabled={!v2vService.isConnected || !textInput.trim()}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
              >
                <span>🎭</span>
                <span>Тест Lip-sync</span>
              </button>
              <span className="text-sm text-gray-600 flex items-center">
                Тестируйте синхронизацию губ аватара с текстом
              </span>
            </div>
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
              <strong>WebSocket URL:</strong> ws://localhost:8000/api/v1/voice/ws/v2v
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
