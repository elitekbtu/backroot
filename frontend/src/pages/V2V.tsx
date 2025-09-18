import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v2vService } from '../api/v2v';
import { locationService } from '../api/location';
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
import type { AvatarConfig, LipSyncData, VisemeData } from '../types/v2v';
import type { 
  LocationContext, 
  GeolocationError,
  LocationPermissionState,
  LocationUIState,
  LocationSettings
} from '../types/location';

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
  
  // Location-related state
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>({
    status: 'unknown',
    canRequest: true,
    message: 'Checking location permission...'
  });
  const [locationUI, setLocationUI] = useState<LocationUIState>({
    isRequesting: false,
    isWatching: false,
    lastUpdate: null,
    error: null,
    showLocationInfo: false
  });
  const [locationSettings] = useState<LocationSettings>({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000,
    watchLocation: false,
    autoUpdateContext: true
  });
  
  // Memoized lip sync data to prevent unnecessary re-renders
  const memoizedLipSyncData = useMemo(() => {
    if (!currentLipSyncData) return null;
    return currentLipSyncData;
  }, [currentLipSyncData]);

  // Memoized avatar options to prevent unnecessary re-renders
  const memoizedAvatarOptions = useMemo(() => ({
    cameraView: 'upper' as const,
    lightAmbientIntensity: 2,
    lightDirectIntensity: 30,
    avatarIdleEyeContact: 0.3,
    avatarIdleHeadMove: 0.5,
    avatarSpeakingEyeContact: 0.7,
    avatarSpeakingHeadMove: 0.3
  }), []);
  
  const userId = user?.id?.toString() || 'anonymous';

  // Location functions
  const requestLocationPermission = useCallback(async () => {
    setLocationUI(prev => ({ ...prev, isRequesting: true, error: null }));
    
    try {
      const location = await locationService.getCurrentLocation({
        enableHighAccuracy: locationSettings.enableHighAccuracy,
        timeout: locationSettings.timeout,
        maximumAge: locationSettings.maximumAge
      });
      
      setLocationPermission({
        status: 'granted',
        canRequest: false,
        message: 'Location access granted'
      });
      
      // Get full location context
      const context = await locationService.getLocationContext(location);
      setLocationContext(context);
      
      // Send location context to AI
      v2vService.sendLocationContext(context);
      
      setLocationUI(prev => ({
        ...prev,
        isRequesting: false,
        lastUpdate: new Date(),
        error: null
      }));
      
      return true;
    } catch (error) {
      const geolocationError = error as GeolocationError;
      console.error('Location request failed:', geolocationError);
      
      let permissionStatus: LocationPermissionState['status'] = 'denied';
      let message = 'Location access denied';
      
      switch (geolocationError.type) {
        case 'permission_denied':
          permissionStatus = 'denied';
          message = 'Location access denied. Please enable location permissions in your browser settings.';
          break;
        case 'position_unavailable':
          permissionStatus = 'denied';
          message = 'Location unavailable. Please check your GPS settings.';
          break;
        case 'timeout':
          permissionStatus = 'denied';
          message = 'Location request timed out. Please try again.';
          break;
        default:
          permissionStatus = 'denied';
          message = 'Failed to get location. Please try again.';
      }
      
      setLocationPermission({
        status: permissionStatus,
        canRequest: true,
        message
      });
      
      setLocationUI(prev => ({
        ...prev,
        isRequesting: false,
        error: message
      }));
      
      // Create fallback location context for AI
      try {
        const fallbackContext = await locationService.getLocationContext({
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          timestamp: Date.now()
        });
        setLocationContext(fallbackContext);
        v2vService.sendLocationContext(fallbackContext);
      } catch (fallbackError) {
        console.warn('Failed to create fallback location context:', fallbackError);
      }
      
      return false;
    }
  }, [locationSettings]);

  const startLocationWatching = useCallback(() => {
    if (locationUI.isWatching) return;
    
    setLocationUI(prev => ({ ...prev, isWatching: true, error: null }));
    
    const watchId = locationService.watchLocation(
      async (location) => {
        setLocationUI(prev => ({
          ...prev,
          lastUpdate: new Date(),
          error: null
        }));
        
        if (locationSettings.autoUpdateContext) {
          try {
            const context = await locationService.getLocationContext(location);
            setLocationContext(context);
            v2vService.sendLocationContext(context);
          } catch (error) {
            console.error('Failed to update location context:', error);
          }
        }
      },
      (error) => {
        console.error('Location watch error:', error);
        setLocationUI(prev => ({
          ...prev,
          isWatching: false,
          error: error.message
        }));
      },
      {
        enableHighAccuracy: locationSettings.enableHighAccuracy,
        timeout: locationSettings.timeout,
        maximumAge: locationSettings.maximumAge
      }
    );
    
    if (watchId === -1) {
      setLocationUI(prev => ({
        ...prev,
        isWatching: false,
        error: 'Location watching not supported'
      }));
    }
  }, [locationSettings, locationUI.isWatching]);

  const stopLocationWatching = useCallback(() => {
    locationService.stopWatchingLocation();
    setLocationUI(prev => ({ ...prev, isWatching: false }));
  }, []);

  const toggleLocationInfo = useCallback(() => {
    setLocationUI(prev => ({ ...prev, showLocationInfo: !prev.showLocationInfo }));
  }, []);


  // Convert text to phonemes (simplified)
  const textToPhonemes = (word: string): string[] => {
    const phonemes: string[] = [];
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const nextChar = word[i + 1];
      
      // Vowels
      if ('aeiou'.includes(char)) {
        if (char === 'a') phonemes.push('aa');
        else if (char === 'e') phonemes.push('E');
        else if (char === 'i') phonemes.push('I');
        else if (char === 'o') phonemes.push('O');
        else if (char === 'u') phonemes.push('U');
      }
      // Consonants
      else if (char === 'p' || char === 'b' || char === 'm') {
        phonemes.push('PP');
      } else if (char === 'f' || char === 'v') {
        phonemes.push('FF');
      } else if (char === 't' || char === 'd') {
        phonemes.push('DD');
      } else if (char === 'k' || char === 'g') {
        phonemes.push('kk');
      } else if (char === 's' || char === 'z') {
        phonemes.push('SS');
      } else if (char === 'n' || char === 'ng') {
        phonemes.push('nn');
      } else if (char === 'r') {
        phonemes.push('RR');
      } else if (char === 'l') {
        phonemes.push('nn'); // Similar to 'n'
      } else if (char === 'w') {
        phonemes.push('U'); // Similar to 'u'
      } else if (char === 'y') {
        phonemes.push('I'); // Similar to 'i'
      } else if (char === 'h') {
        phonemes.push('aa'); // Open mouth for 'h'
      } else if (char === 'c' || char === 'q') {
        if (nextChar === 'h') {
          phonemes.push('CH');
          i++; // Skip next character
        } else {
          phonemes.push('kk');
        }
      } else if (char === 's' && nextChar === 'h') {
        phonemes.push('CH');
        i++; // Skip next character
      } else if (char === 't' && nextChar === 'h') {
        phonemes.push('TH');
        i++; // Skip next character
      } else {
        // Default to silence for unknown characters
        phonemes.push('sil');
      }
    }
    
    return phonemes;
  };

  // Convert phoneme to viseme
  const phonemeToViseme = (phoneme: string): string => {
    const visemeMap: { [key: string]: string } = {
      'aa': 'aa', 'E': 'E', 'I': 'I', 'O': 'O', 'U': 'U',
      'PP': 'PP', 'FF': 'FF', 'DD': 'DD', 'kk': 'kk',
      'SS': 'SS', 'nn': 'nn', 'RR': 'RR', 'CH': 'CH', 'TH': 'TH',
      'sil': 'sil'
    };
    
    return visemeMap[phoneme] || 'sil';
  };


  // Play audio with lip sync synchronization
  const playAudioWithLipSync = (audioData: string, lipSyncData: LipSyncData) => {
    try {
      // Create audio element
      const audio = new Audio(`data:audio/wav;base64,${audioData}`);
      
      // Set up audio event listeners
      audio.addEventListener('loadeddata', () => {
        console.log('Audio loaded, starting lip sync');
        setCurrentLipSyncData(lipSyncData);
        setProcessingState('playing');
      });
      
      audio.addEventListener('ended', () => {
        console.log('Audio ended, stopping lip sync');
        setCurrentLipSyncData(null);
        setProcessingState('idle');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setError('Ошибка воспроизведения аудио');
        setProcessingState('idle');
      });
      
      // Start playing
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
        setError('Не удалось воспроизвести аудио');
        setProcessingState('idle');
      });
      
    } catch (error) {
      console.error('Error setting up audio playback:', error);
      setError('Ошибка настройки воспроизведения аудио');
    }
  };

  // Enhanced lip sync data generation with audio analysis
  const generateEnhancedLipSyncData = (text: string, audioDuration?: number): LipSyncData => {
    const words = text.toLowerCase().split(/\s+/);
    const visemes: string[] = [];
    const times: number[] = [];
    const durations: number[] = [];
    const timing: VisemeData[] = [];
    
    let currentTime = 0;
    const totalTextDuration = audioDuration || (text.length * 0.08); // Estimate if no audio duration
    
    words.forEach((word, wordIndex) => {
      const phonemes = textToPhonemes(word);
      const wordDuration = (word.length / text.length) * totalTextDuration;
      const phonemeDuration = wordDuration / phonemes.length;
      
      phonemes.forEach((phoneme) => {
        const viseme = phonemeToViseme(phoneme);
        const duration = Math.max(0.05, phonemeDuration * 0.8); // Ensure minimum duration
        
        visemes.push(viseme);
        times.push(currentTime);
        durations.push(duration);
        timing.push({
          viseme: viseme,
          start_time: currentTime,
          duration: duration
        });
        
        currentTime += duration;
      });
      
      // Add pause between words
      if (wordIndex < words.length - 1) {
        const pauseDuration = 0.08;
        visemes.push('sil');
        times.push(currentTime);
        durations.push(pauseDuration);
        timing.push({
          viseme: 'sil',
          start_time: currentTime,
          duration: pauseDuration
        });
        currentTime += pauseDuration;
      }
    });
    
    return {
      visemes,
      times,
      durations,
      timing
    };
  };

  // Memoized avatar configuration to prevent unnecessary re-renders
  const avatarConfig: AvatarConfig = useMemo(() => ({
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
  }), [avatarMood]);

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
          
          // Add to conversation history with location context
          setConversationHistory(prev => [...prev, {
            timestamp: response.timestamp,
            user_input: response.transcript,
            ai_response: response.ai_response,
            type: 'voice',
            location_context: response.location_context || locationContext || undefined
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
          
          // Create enhanced lip sync data from response text
          // This simulates phoneme-to-viseme conversion with better timing
          const lipSyncData = generateEnhancedLipSyncData(response.ai_response);
          
          // Play audio with synchronized lip sync
          playAudioWithLipSync(response.audio_response, lipSyncData);
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

        v2vService.setOnLocationUpdate((context) => {
          console.log('Location context updated:', context);
          setLocationContext(context);
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
          
          // Request location permission after successful connection
          try {
            await requestLocationPermission();
          } catch (error) {
            console.warn('Failed to get location on initialization:', error);
            // Don't show error to user on initialization, just log it
          }
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

  // Memoized avatar handlers to prevent unnecessary re-renders
  const handleAvatarReady = useCallback(() => {
    setAvatarReady(true);
    setAvatarError(null);
    console.log('Avatar is ready!');
  }, []);

  const handleAvatarError = useCallback((error: Error) => {
    setAvatarError(error.message);
    setAvatarReady(false);
    console.error('Avatar error:', error);
  }, []);

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
      const success = v2vService.sendTextInput(textInput.trim(), locationContext || undefined);
      if (success) {
        // Add to conversation history immediately
        setConversationHistory(prev => [...prev, {
          timestamp: new Date().toISOString(),
          user_input: textInput.trim(),
          ai_response: '',
          type: 'text',
          location_context: locationContext || undefined
        }]);
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

        {/* Location Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Местоположение</h2>
            <div className="flex space-x-2">
              <button
                onClick={toggleLocationInfo}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {locationUI.showLocationInfo ? 'Скрыть' : 'Показать'} детали
              </button>
              {locationPermission.status === 'denied' && locationPermission.canRequest && (
                <button
                  onClick={requestLocationPermission}
                  disabled={locationUI.isRequesting}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {locationUI.isRequesting ? 'Запрос...' : 'Разрешить'}
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {locationPermission.status === 'granted' ? '📍' : 
                 locationPermission.status === 'denied' ? '🚫' : '❓'}
              </span>
              <div>
                <div className={`font-medium ${
                  locationPermission.status === 'granted' ? 'text-green-600' :
                  locationPermission.status === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {locationContext ? locationContext.city.name : 'Местоположение неизвестно'}
                </div>
                <div className="text-sm text-gray-600">
                  {locationContext ? `${locationContext.city.country}` : locationPermission.message}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {locationUI.isWatching ? '👁️' : '👁️‍🗨️'}
              </span>
              <div>
                <div className="font-medium text-gray-700">
                  {locationUI.isWatching ? 'Отслеживание активно' : 'Отслеживание отключено'}
                </div>
                <div className="text-sm text-gray-600">
                  {locationUI.lastUpdate ? 
                    `Обновлено: ${locationUI.lastUpdate.toLocaleTimeString()}` : 
                    'Нет данных'
                  }
                </div>
              </div>
            </div>
          </div>

          {locationUI.showLocationInfo && locationContext && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Информация о городе</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Город:</strong> {locationContext.city.name}
                </div>
                <div>
                  <strong>Страна:</strong> {locationContext.city.country}
                </div>
                <div>
                  <strong>Часовой пояс:</strong> {locationContext.timezone}
                </div>
                <div>
                  <strong>Местное время:</strong> {locationContext.localTime}
                </div>
                <div>
                  <strong>Координаты:</strong> {locationContext.city.coordinates.lat.toFixed(4)}, {locationContext.city.coordinates.lon.toFixed(4)}
                </div>
                <div>
                  <strong>Достопримечательности:</strong> {locationContext.attractions.length}
                </div>
              </div>
              
              {locationContext.attractions.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Популярные места:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {locationContext.attractions.slice(0, 4).map((attraction, index) => (
                      <div key={index} className="p-2 bg-white rounded border">
                        <div className="font-medium text-sm">{attraction.name}</div>
                        <div className="text-xs text-gray-600">{attraction.description}</div>
                        {attraction.rating && (
                          <div className="text-xs text-yellow-600">⭐ {attraction.rating}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {locationUI.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {locationUI.error}
            </div>
          )}
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
                lipSyncData={memoizedLipSyncData}
                isPlaying={processingState === 'playing'}
                avatarConfig={avatarConfig}
                mood={avatarMood}
                options={memoizedAvatarOptions}
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
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    memoizedLipSyncData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {memoizedLipSyncData ? '🎭 Lip Sync Active' : '😐 No Lip Sync'}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Avatar Features</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✅ Ready Player Me</li>
                  <li>✅ Realistic Lip Sync</li>
                  <li>✅ Phoneme-to-Viseme Mapping</li>
                  <li>✅ Mood Expressions</li>
                  <li>✅ Eye Contact</li>
                  <li>✅ Idle Animations</li>
                  <li>✅ Audio Synchronization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Голосовое управление</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex flex-wrap gap-2">
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
              
              {locationPermission.status === 'granted' && (
                <>
                  <button
                    onClick={locationUI.isWatching ? stopLocationWatching : startLocationWatching}
                    className={`px-4 py-3 text-white rounded-lg hover:opacity-80 flex items-center space-x-2 transition-all ${
                      locationUI.isWatching ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    <span className="text-xl">{locationUI.isWatching ? '⏸️' : '👁️'}</span>
                    <span>{locationUI.isWatching ? 'Остановить отслеживание' : 'Начать отслеживание'}</span>
                  </button>
                  
                  <button
                    onClick={requestLocationPermission}
                    disabled={locationUI.isRequesting}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                  >
                    <span className="text-xl">🔄</span>
                    <span>{locationUI.isRequesting ? 'Обновление...' : 'Обновить местоположение'}</span>
                  </button>
                </>
              )}
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
              <strong>WebSocket URL:</strong> {import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'}/api/v1/voice/ws/v2v/{userId}
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
            <div>
              <strong>Геолокация:</strong> 
              <span className={`ml-2 ${
                locationPermission.status === 'granted' ? 'text-green-600' :
                locationPermission.status === 'denied' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {locationPermission.status === 'granted' ? '✅ Активна' :
                 locationPermission.status === 'denied' ? '❌ Отключена' : '⏳ Проверка...'}
              </span>
            </div>
            <div>
              <strong>Отслеживание:</strong> 
              <span className={`ml-2 ${locationUI.isWatching ? 'text-green-600' : 'text-gray-600'}`}>
                {locationUI.isWatching ? '✅ Активно' : '⏸️ Отключено'}
              </span>
            </div>
            {locationContext && (
              <>
                <div>
                  <strong>Текущий город:</strong> {locationContext.city.name}, {locationContext.city.country}
                </div>
                <div>
                  <strong>Часовой пояс:</strong> {locationContext.timezone}
                </div>
                <div>
                  <strong>Местное время:</strong> {locationContext.localTime}
                </div>
                <div>
                  <strong>Достопримечательности:</strong> {locationContext.attractions.length} найдено
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default V2V;