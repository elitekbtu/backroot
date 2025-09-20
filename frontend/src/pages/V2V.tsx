import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v2vService } from '../api/v2v';
import { locationService } from '../api/location';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import TalkingHead from '../components/TalkingHead';
import LanguageSelector from '../components/LanguageSelector';
import { AIVoiceInput } from '../components/ui/ai-voice-input';
import { PlaceholdersAndVanishInput } from '../components/ui/placeholders-and-vanish-input';
import { MapPin, X, HelpCircle, Eye, EyeOff, Pause } from 'lucide-react';
import type { 
  VoiceResponseMessage, 
  VoiceProcessingState
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
  const { language } = useLanguage();
  const deviceInfo = useDeviceDetection();
  const [processingState, setProcessingState] = useState<VoiceProcessingState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
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
    avatarSpeakingHeadMove: 0.3,
    cameraDistance: 1.8, // Немного дальше для лучшего обзора
    cameraHeight: 0.2,   // Немного выше для лучшего угла
    cameraAngle: 0.0,    // Без наклона - ровно
    avatarPosition: { x: 0, y: -0.1, z: 0 }, // Немного ниже для центрирования
    avatarRotation: { x: 0, y: 0, z: 0 }, // Без поворота - ровно стоит
    canvasWidth: deviceInfo.isMobile ? 256 : deviceInfo.isKiosk ? 384 : 320,
    canvasHeight: deviceInfo.isMobile ? 256 : deviceInfo.isKiosk ? 384 : 320
  }), [deviceInfo.isMobile, deviceInfo.isKiosk]);
  
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



  // Convert text to phonemes (simplified) - supports both English and Kazakh
  const textToPhonemes = (word: string): string[] => {
    const phonemes: string[] = [];
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toLowerCase();
      const nextChar = word[i + 1]?.toLowerCase();
      
      // English vowels
      if ('aeiou'.includes(char)) {
        if (char === 'a') phonemes.push('aa');
        else if (char === 'e') phonemes.push('E');
        else if (char === 'i') phonemes.push('I');
        else if (char === 'o') phonemes.push('O');
        else if (char === 'u') phonemes.push('U');
      }
      // Kazakh vowels (Cyrillic)
      else if ('аәеиоөұүыі'.includes(char)) {
        if (char === 'а' || char === 'ә') phonemes.push('aa');
        else if (char === 'е') phonemes.push('E');
        else if (char === 'и' || char === 'ы' || char === 'і') phonemes.push('I');
        else if (char === 'о' || char === 'ө') phonemes.push('O');
        else if (char === 'ұ' || char === 'ү') phonemes.push('U');
      }
      // English consonants
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
      }
      // Kazakh consonants (Cyrillic)
      else if (char === 'п' || char === 'б' || char === 'м') {
        phonemes.push('PP');
      } else if (char === 'ф' || char === 'в') {
        phonemes.push('FF');
      } else if (char === 'т' || char === 'д') {
        phonemes.push('DD');
      } else if (char === 'к' || char === 'г' || char === 'қ' || char === 'ғ') {
        phonemes.push('kk');
      } else if (char === 'с' || char === 'з' || char === 'ц') {
        phonemes.push('SS');
      } else if (char === 'н' || char === 'ң') {
        phonemes.push('nn');
      } else if (char === 'р') {
        phonemes.push('RR');
      } else if (char === 'л') {
        phonemes.push('nn'); // Similar to 'n'
      } else if (char === 'ш' || char === 'щ' || char === 'ч' || char === 'ж') {
        phonemes.push('CH');
      } else if (char === 'х' || char === 'һ') {
        phonemes.push('aa'); // Open mouth for 'h'
      } else if (char === 'й') {
        phonemes.push('I'); // Similar to 'i'
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
    avatarSpeakingHeadMove: 0.3,
    cameraDistance: 1.8, // Немного дальше для лучшего обзора
    cameraHeight: 0.2,   // Немного выше для лучшего угла
    cameraAngle: 0.0,    // Без наклона - ровно
    avatarPosition: { x: 0, y: -0.1, z: 0 }, // Немного ниже для центрирования
    avatarRotation: { x: 0, y: 0, z: 0 }, // Без поворота - ровно стоит
    canvasWidth: deviceInfo.isMobile ? 256 : deviceInfo.isKiosk ? 384 : 320,
    canvasHeight: deviceInfo.isMobile ? 256 : deviceInfo.isKiosk ? 384 : 320
  }), [avatarMood, deviceInfo.isMobile, deviceInfo.isKiosk]);

  // Initialize V2V service
  useEffect(() => {
    const initializeService = async () => {
      try {
        console.log('Initializing V2V service for user:', userId);

        // Set up event handlers
        v2vService.setOnConnectionChange((state) => {
          console.log('Connection state changed:', state);
          if (state === 'error') {
            setError('Ошибка подключения к сервису');
          } else if (state === 'connected') {
            setError(null);
          }
        });

        v2vService.setOnVoiceResponse((response: VoiceResponseMessage) => {
          console.log('Voice response received:', response);
          
          // Voice response processed

          // Set avatar mood based on response content (simple sentiment analysis)
          // Support both English and Kazakh keywords
          const responseText = response.ai_response.toLowerCase();
          if (responseText.includes('happy') || responseText.includes('great') || responseText.includes('wonderful') ||
              responseText.includes('қуанышты') || responseText.includes('жақсы') || responseText.includes('керемет') ||
              responseText.includes('тамаша') || responseText.includes('әдемі')) {
            setAvatarMood('happy');
          } else if (responseText.includes('sad') || responseText.includes('sorry') || responseText.includes('unfortunately') ||
                     responseText.includes('қайғылы') || responseText.includes('кешіріңіз') || responseText.includes('өкінішті') ||
                     responseText.includes('жаман') || responseText.includes('ауыр')) {
            setAvatarMood('sad');
          } else if (responseText.includes('angry') || responseText.includes('frustrated') ||
                     responseText.includes('ашулы') || responseText.includes('ашу') || responseText.includes('ызалы')) {
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
        });

        v2vService.setOnLocationUpdate((context) => {
          console.log('Location context updated:', context);
          setLocationContext(context);
        });

        // Set initial language
        v2vService.setLanguage(language);

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

  // Update language in V2V service when language changes
  useEffect(() => {
    if (isInitialized) {
      v2vService.setLanguage(language);
      console.log('Language updated in V2V service:', language);
    }
  }, [language, isInitialized]);

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

  const handleStopRecording = (duration?: number) => {
    v2vService.stopRecording();
    setIsRecording(false);
    if (duration) {
      console.log(`Recording stopped after ${duration} seconds`);
    }
  };

  const handleTextSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    if (textInput.trim()) {
      const success = v2vService.sendTextInput(textInput.trim(), locationContext || undefined, language);
      if (success) {
        setTextInput('');
        setError(null);
      } else {
        setError('Не удалось отправить сообщение');
      }
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
    <div className={`min-h-screen bg-gray-50 ${deviceInfo.isKiosk ? 'text-2xl' : ''}`}>
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className={`font-bold text-gray-900 mb-2 ${
            deviceInfo.isKiosk 
              ? 'text-5xl sm:text-6xl' 
              : deviceInfo.isMobile
              ? 'text-xl sm:text-2xl'
              : 'text-2xl sm:text-3xl lg:text-4xl'
          }`}>
            Voice to Voice AI
          </h1>
          <p className={`text-gray-600 ${
            deviceInfo.isKiosk 
              ? 'text-xl sm:text-2xl' 
              : deviceInfo.isMobile
              ? 'text-sm sm:text-base'
              : 'text-base sm:text-lg'
          }`}>
            Общайтесь с ИИ через голос в реальном времени
          </p>
        </div>

        {/* Location Status */}
        <div className={`bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm mb-4 sm:mb-6 ${
          deviceInfo.isKiosk ? 'p-6 sm:p-8' : 
          deviceInfo.isMobile ? 'p-3 sm:p-4' : 'p-4 sm:p-6'
        }`}>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <span className={`${
                deviceInfo.isKiosk ? 'text-4xl sm:text-5xl' : 
                deviceInfo.isMobile ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
              }`}>
                {locationPermission.status === 'granted' ? <MapPin className="w-6 h-6 text-green-500" /> : 
                 locationPermission.status === 'denied' ? <X className="w-6 h-6 text-red-500" /> : <HelpCircle className="w-6 h-6 text-yellow-500" />}
              </span>
              <div>
                <div className={`font-medium ${
                  deviceInfo.isKiosk ? 'text-lg sm:text-xl' : 
                  deviceInfo.isMobile ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                } ${
                  locationPermission.status === 'granted' ? 'text-green-600' :
                  locationPermission.status === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {locationContext ? locationContext.city.name : 'Местоположение неизвестно'}
                </div>
                <div className={`text-gray-600 ${
                  deviceInfo.isKiosk ? 'text-base sm:text-lg' : 
                  deviceInfo.isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                }`}>
                  {locationContext ? `${locationContext.city.country}` : locationPermission.message}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`${
                deviceInfo.isKiosk ? 'text-4xl sm:text-5xl' : 
                deviceInfo.isMobile ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
              }`}>
                {locationUI.isWatching ? <Eye className="w-6 h-6 text-blue-500" /> : <EyeOff className="w-6 h-6 text-gray-500" />}
              </span>
              <div>
                <div className={`font-medium text-gray-700 ${
                  deviceInfo.isKiosk ? 'text-lg sm:text-xl' : 
                  deviceInfo.isMobile ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                }`}>
                  {locationUI.isWatching ? 'Отслеживание активно' : 'Отслеживание отключено'}
                </div>
                <div className={`text-gray-600 ${
                  deviceInfo.isKiosk ? 'text-base sm:text-lg' : 
                  deviceInfo.isMobile ? 'text-xs' : 'text-xs sm:text-sm'
                }`}>
                  {locationUI.lastUpdate ? 
                    `Обновлено: ${locationUI.lastUpdate.toLocaleTimeString()}` : 
                    'Нет данных'
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`${
                deviceInfo.isKiosk ? 'text-4xl sm:text-5xl' : 
                deviceInfo.isMobile ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
              }`}>
                🌐
              </span>
              <div className="flex-1">
                <div className={`font-medium text-gray-700 ${
                  deviceInfo.isKiosk ? 'text-lg sm:text-xl' : 
                  deviceInfo.isMobile ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                }`}>
                  Язык ответа
                </div>
                <div className="mt-1">
                  <LanguageSelector />
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
                      <div key={index} className="p-2 bg-white/20 backdrop-blur-sm border border-gray-200/30 rounded">
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
        <div className="bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">AI Avatar</h2>
          <div className="flex justify-center items-center">
            <div className={`relative flex items-center justify-center ${
              deviceInfo.isKiosk ? 'w-96 h-96' : 
              deviceInfo.isMobile ? 'w-64 h-64' : 'w-80 h-80'
            }`}>
              <div className="relative w-full h-full object-contain">
                <div className={`w-full ${
                  deviceInfo.isKiosk ? 'h-96' : 
                  deviceInfo.isMobile ? 'h-64' : 'h-80'
                } bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden`}>
                  <TalkingHead
                    className="w-full h-full object-contain"
                    lipSyncData={memoizedLipSyncData}
                    isPlaying={processingState === 'playing'}
                    avatarConfig={avatarConfig}
                    mood={avatarMood}
                    options={memoizedAvatarOptions}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Controls */}
        <div className={`bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm mb-4 sm:mb-6 ${
          deviceInfo.isKiosk ? 'p-6 sm:p-8' : 
          deviceInfo.isMobile ? 'p-3 sm:p-4' : 'p-4 sm:p-6'
        }`}>
          <h2 className={`font-semibold mb-4 ${
            deviceInfo.isKiosk ? 'text-2xl sm:text-3xl' : 
            deviceInfo.isMobile ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
          }`}>
            Голосовое управление
          </h2>
          <div className="flex flex-col gap-4">
            {/* AI Voice Input Component */}
            <div className="flex justify-center">
              <AIVoiceInput
                onStart={handleStartRecording}
                onStop={handleStopRecording}
                visualizerBars={48}
                className="w-full max-w-md"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              
              {locationPermission.status === 'granted' && (
                <>
                  <button
                    onClick={locationUI.isWatching ? stopLocationWatching : startLocationWatching}
                    className={`text-white rounded-lg hover:opacity-80 flex items-center space-x-2 transition-all ${
                      locationUI.isWatching ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                    } ${
                      deviceInfo.isKiosk ? 'px-8 py-4 text-xl' : 
                      deviceInfo.isMobile ? 'px-3 py-2 text-sm' : 'px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base'
                    }`}
                  >
                    <span className={`${
                      deviceInfo.isKiosk ? 'text-2xl' : 
                      deviceInfo.isMobile ? 'text-lg' : 'text-lg sm:text-xl'
                    }`}>
                      {locationUI.isWatching ? <Pause className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </span>
                    <span className={deviceInfo.isKiosk ? 'hidden sm:inline' : ''}>
                      {locationUI.isWatching ? 'Остановить отслеживание' : 'Начать отслеживание'}
                    </span>
                  </button>
                  
                  <button
                    onClick={requestLocationPermission}
                    disabled={locationUI.isRequesting}
                    className={`bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all ${
                      deviceInfo.isKiosk ? 'px-8 py-4 text-xl' : 
                      deviceInfo.isMobile ? 'px-3 py-2 text-sm' : 'px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base'
                    }`}
                  >
                    <span className={`${
                      deviceInfo.isKiosk ? 'text-2xl' : 
                      deviceInfo.isMobile ? 'text-lg' : 'text-lg sm:text-xl'
                    }`}>🔄</span>
                    <span className={deviceInfo.isKiosk ? 'hidden sm:inline' : ''}>
                      {locationUI.isRequesting ? 'Обновление...' : 'Обновить местоположение'}
                    </span>
                  </button>
                </>
              )}
            </div>

            <div className={`text-gray-600 ${
              deviceInfo.isMobile ? 'text-xs' : 'text-sm'
            }`}>
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
        <div className={`bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm mb-4 sm:mb-6 ${
          deviceInfo.isKiosk ? 'p-6 sm:p-8' : 
          deviceInfo.isMobile ? 'p-3 sm:p-4' : 'p-4 sm:p-6'
        }`}>
          <h2 className={`font-semibold mb-4 ${
            deviceInfo.isKiosk ? 'text-2xl sm:text-3xl' : 
            deviceInfo.isMobile ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
          }`}>
            Текстовый ввод
          </h2>
          <PlaceholdersAndVanishInput
            placeholders={[
              "Введите ваше сообщение...",
              "Спросите что-нибудь у ИИ",
              "Расскажите о погоде",
              "Как дела?",
              "Что нового?"
            ]}
            onChange={(e) => setTextInput(e.target.value)}
            onSubmit={handleTextSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default V2V;