import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { v2vService } from '../api/v2v';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { useLocation } from '../hooks/useLocation';
import { useLipSync } from '../hooks/useLipSync';
import { ChatHistory } from '../components/ui/chat-history';
import { 
  LocationCard, 
  TrackingCard, 
  LanguageCard, 
  AvatarSection, 
  VoiceControls, 
  TextInputSection 
} from '../components/v2v';
import type { 
  VoiceResponseMessage, 
  VoiceProcessingState
} from '../api/v2v';
import type { AvatarConfig } from '../types/v2v';
import type { LocationSettings } from '../types/location';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const V2V: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const deviceInfo = useDeviceDetection();
  const [processingState, setProcessingState] = useState<VoiceProcessingState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [avatarMood, setAvatarMood] = useState<string>('neutral');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Location settings
  const [locationSettings] = useState<LocationSettings>({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000,
    watchLocation: false,
    autoUpdateContext: true
  });

  // Custom hooks
  const {
    locationContext,
    locationPermission,
    locationUI,
    requestLocationPermission,
    startLocationWatching,
    stopLocationWatching,
    setLocationContext
  } = useLocation(locationSettings);

  const {
    currentLipSyncData,
    generateEnhancedLipSyncData,
    playAudioWithLipSync
  } = useLipSync();
  
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
          const lipSyncData = generateEnhancedLipSyncData(response.ai_response);
          
          // Play audio with synchronized lip sync
          playAudioWithLipSync(
            response.audio_response, 
            lipSyncData,
            () => setProcessingState('playing'),
            () => setProcessingState('idle'),
            (error) => setError(error)
          );
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
            const result = await requestLocationPermission();
            if (result.success && result.context) {
              v2vService.sendLocationContext(result.context);
            }
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

  const handleStartLocationWatching = () => {
    startLocationWatching();
  };

  const handleStopLocationWatching = () => {
    stopLocationWatching();
  };

  const handleRequestLocationPermission = async () => {
    const result = await requestLocationPermission();
    if (result.success && result.context) {
      v2vService.sendLocationContext(result.context);
    }
  };

  // Chat functions
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatMessages([]);
  }, []);

  const handleTextSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    if (textInput.trim()) {
      // Add user message to chat
      addMessage({
        type: 'user',
        content: textInput.trim(),
      });

      // Add typing indicator
      addMessage({
        type: 'ai',
        content: '',
        isTyping: true,
      });

      const success = v2vService.sendTextInput(textInput.trim(), locationContext || undefined, language);
      if (success) {
        setTextInput('');
        setError(null);
        
        // Simulate AI response (replace with actual response handling)
        setTimeout(() => {
          setChatMessages(prev => prev.filter(msg => !msg.isTyping));
          addMessage({
            type: 'ai',
            content: 'Thank you for your message! I am processing your request...',
          });
        }, 2000);
      } else {
        setChatMessages(prev => prev.filter(msg => !msg.isTyping));
        setError('Failed to send message');
      }
    }
  };

  const handleChatMessage = useCallback((message: string) => {
    if (message.trim()) {
      addMessage({
        type: 'user',
        content: message.trim(),
      });

      addMessage({
        type: 'ai',
        content: '',
        isTyping: true,
      });

      const success = v2vService.sendTextInput(message.trim(), locationContext || undefined, language);
      if (success) {
        setError(null);
        
        setTimeout(() => {
          setChatMessages(prev => prev.filter(msg => !msg.isTyping));
          addMessage({
            type: 'ai',
            content: 'I received your message and I am processing it...',
          });
        }, 2000);
      } else {
        setChatMessages(prev => prev.filter(msg => !msg.isTyping));
        setError('Failed to send message');
      }
    }
  }, [addMessage, locationContext, language]);



  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing AsylAI service...</p>
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <motion.h1 
            className={`font-bold text-gray-800 mb-4 ${
              deviceInfo.isKiosk 
                ? 'text-5xl sm:text-6xl' 
                : deviceInfo.isMobile
                ? 'text-2xl sm:text-3xl'
                : 'text-3xl sm:text-4xl lg:text-5xl'
            }`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            AsylAI
          </motion.h1>
          <motion.p 
            className={`text-gray-600 ${
              deviceInfo.isKiosk 
                ? 'text-xl sm:text-2xl' 
                : deviceInfo.isMobile
                ? 'text-sm sm:text-base'
                : 'text-base sm:text-lg'
            }`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Communicate with AI through voice in real-time
          </motion.p>
        </motion.div>

        {/* Status Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <LocationCard 
            locationContext={locationContext}
            locationPermission={locationPermission}
          />
          <TrackingCard locationUI={locationUI} />
          <LanguageCard 
            language={language}
            onLanguageChange={(lang) => {
              console.log('Language changed to:', lang);
            }}
          />
        </motion.div>

          {locationUI.showLocationInfo && locationContext && (
            <div className="mt-4 p-4 bg-white/30 backdrop-blur-sm border border-gray-200/30 rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">City Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <strong className="text-gray-800">City:</strong> {locationContext.city.name}
                </div>
                <div>
                  <strong className="text-gray-800">Country:</strong> {locationContext.city.country}
                </div>
                <div>
                  <strong className="text-gray-800">Timezone:</strong> {locationContext.timezone}
                </div>
                <div>
                  <strong className="text-gray-800">Local Time:</strong> {locationContext.localTime}
                </div>
                <div>
                  <strong className="text-gray-800">Coordinates:</strong> {locationContext.city.coordinates.lat.toFixed(4)}, {locationContext.city.coordinates.lon.toFixed(4)}
                </div>
                <div>
                  <strong className="text-gray-800">Attractions:</strong> {locationContext.attractions.length}
                </div>
              </div>
              
              {locationContext.attractions.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold text-gray-800 mb-2">Popular Places:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {locationContext.attractions.slice(0, 4).map((attraction, index) => (
                      <div key={index} className="p-2 bg-white/50 border border-gray-200 rounded">
                        <div className="font-medium text-sm text-gray-800">{attraction.name}</div>
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
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {locationUI.error}
            </div>
          )}



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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI Avatar Section */}
          <AvatarSection
            processingState={processingState}
            currentLipSyncData={memoizedLipSyncData}
            avatarConfig={avatarConfig}
            avatarMood={avatarMood}
            memoizedAvatarOptions={memoizedAvatarOptions}
          />

          {/* Chat History Section */}
          <motion.div 
            className="relative"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="h-[500px] rounded-lg border border-gray-200 bg-white/30 backdrop-blur-sm hover:bg-white/40 transition-all duration-300">
              <ChatHistory
                messages={chatMessages}
                onSendMessage={handleChatMessage}
                onClearHistory={clearChatHistory}
                className="h-full"
              />
            </div>
          </motion.div>
        </div>

        {/* Voice Controls */}
        <VoiceControls
          isRecording={isRecording}
          processingState={processingState}
          locationPermission={locationPermission}
          locationUI={locationUI}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onStartLocationWatching={handleStartLocationWatching}
          onStopLocationWatching={handleStopLocationWatching}
          onRequestLocationPermission={handleRequestLocationPermission}
        />

        {/* Text Input */}
        <TextInputSection
          onTextChange={(e) => setTextInput(e.target.value)}
          onSubmit={handleTextSubmit}
        />
      </div>
    </motion.div>
  );
};

export default V2V;