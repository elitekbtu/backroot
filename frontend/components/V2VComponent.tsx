import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface V2VMessage {
  timestamp: string;
  user_input: string;
  ai_response: string;
  type: 'voice' | 'text';
}

interface LipSyncData {
  type: string;
  visemes: string[];
  timing: Array<{
    phoneme: string;
    start_time: number;
    duration: number;
  }>;
  duration: number;
  language: string;
}

interface V2VComponentProps {
  userId?: string;
  serverUrl?: string;
  onClose?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function V2VComponent({ 
  userId = "demo_user_123", 
  serverUrl = "ws://localhost:8000",
  onClose 
}: V2VComponentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [conversationHistory, setConversationHistory] = useState<V2VMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentAIResponse, setCurrentAIResponse] = useState('');
  const [recordingPermission, setRecordingPermission] = useState<Audio.PermissionStatus | null>(null);
  const [avatarReady, setAvatarReady] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const audioPlayerRef = useRef<Audio.Sound | null>(null);
  const webViewRef = useRef<WebView | null>(null);
  const insets = useSafeAreaInsets();

  // HTML content for TalkingHead integration
  const talkingHeadHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TalkingHead V2V</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: #1a1a1a;
                font-family: Arial, sans-serif;
                overflow: hidden;
            }
            #avatar-container {
                width: 100%;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            #avatar-canvas {
                width: 100%;
                height: 100%;
                border: none;
            }
            #controls {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 10px;
                z-index: 1000;
            }
            .control-btn {
                background: rgba(0, 122, 255, 0.8);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            .control-btn:hover {
                background: rgba(0, 122, 255, 1);
                transform: translateY(-2px);
            }
            #status {
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 1000;
                backdrop-filter: blur(10px);
            }
            #avatar-selector {
                position: absolute;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }
            .avatar-option {
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 8px 12px;
                margin: 2px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
            }
            .avatar-option:hover {
                background: rgba(0, 122, 255, 0.8);
                border-color: rgba(0, 122, 255, 0.8);
            }
            .avatar-option.active {
                background: rgba(0, 122, 255, 1);
                border-color: rgba(0, 122, 255, 1);
            }
            #loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                text-align: center;
                z-index: 1000;
            }
            .spinner {
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid #007AFF;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div id="avatar-container">
            <div id="loading">
                <div class="spinner"></div>
                <div>Loading TalkingHead...</div>
            </div>
            
            <div id="status" style="display: none;">Initializing...</div>
            
            <div id="avatar-selector" style="display: none;">
                <div class="avatar-option active" onclick="changeAvatar('default')">Default</div>
                <div class="avatar-option" onclick="changeAvatar('female')">Female</div>
                <div class="avatar-option" onclick="changeAvatar('male')">Male</div>
                <div class="avatar-option" onclick="changeAvatar('custom')">Custom</div>
            </div>
            
            <canvas id="avatar-canvas"></canvas>
            
            <div id="controls" style="display: none;">
                <button class="control-btn" onclick="testLipSync()">Test Lip Sync</button>
                <button class="control-btn" onclick="resetAvatar()">Reset Avatar</button>
                <button class="control-btn" onclick="toggleSubtitles()">Toggle Subtitles</button>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@main/modules/TalkingHead.js"></script>
        <script>
            let head;
            let isAvatarReady = false;
            let currentAvatar = 'default';
            let subtitlesEnabled = true;

            // Avatar URLs
            const avatarUrls = {
                'default': 'https://models.readyplayer.me/64f7c0c4c4c4c4c4c4c4c4c4.glb',
                'female': 'https://models.readyplayer.me/64f7c0c4c4c4c4c4c4c4c4c4.glb',
                'male': 'https://models.readyplayer.me/64f7c0c4c4c4c4c4c4c4c4c4.glb',
                'custom': 'https://models.readyplayer.me/64f7c0c4c4c4c4c4c4c4c4c4.glb'
            };

            // Initialize TalkingHead
            async function initTalkingHead() {
                try {
                    const container = document.getElementById('avatar-canvas');
                    
                    // Create TalkingHead instance with enhanced settings
                    head = new TalkingHead(container, {
                        avatarUrl: avatarUrls.default,
                        cameraDistance: 2.5,
                        cameraHeight: 1.6,
                        cameraAngle: 15,
                        backgroundColor: 0x1a1a1a,
                        showSubtitles: true,
                        subtitlesColor: 0xffffff,
                        subtitlesSize: 24,
                        subtitlesY: -1.5,
                        lipsyncLang: 'en',
                        mood: 'happy',
                        lighting: {
                            ambient: 0x404040,
                            directional: 0xffffff,
                            intensity: 0.8
                        },
                        update: (dt) => {
                            // Custom update function for smooth animations
                        }
                    });

                    // Load default avatar
                    await loadAvatar('default');
                    
                } catch (error) {
                    console.error('Error initializing TalkingHead:', error);
                    document.getElementById('status').textContent = 'Error: ' + error.message;
                    document.getElementById('status').style.display = 'block';
                }
            }

            // Load avatar with error handling
            async function loadAvatar(avatarType) {
                try {
                    document.getElementById('status').textContent = 'Loading ' + avatarType + ' avatar...';
                    document.getElementById('status').style.display = 'block';
                    
                    await head.showAvatar({
                        avatarUrl: avatarUrls[avatarType],
                        lipsyncLang: 'en',
                        onLoad: () => {
                            console.log('Avatar loaded successfully');
                        }
                    });

                    currentAvatar = avatarType;
                    isAvatarReady = true;
                    
                    // Update UI
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('status').textContent = 'Avatar Ready';
                    document.getElementById('status').style.display = 'block';
                    document.getElementById('avatar-selector').style.display = 'block';
                    document.getElementById('controls').style.display = 'flex';
                    
                    // Update active avatar option
                    document.querySelectorAll('.avatar-option').forEach(opt => {
                        opt.classList.remove('active');
                    });
                    document.querySelector(\`[onclick="changeAvatar('\${avatarType}')"]\`).classList.add('active');
                    
                    // Notify React Native that avatar is ready
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'avatar_ready',
                            status: 'ready',
                            avatarType: avatarType
                        }));
                    }
                    
                } catch (error) {
                    console.error('Error loading avatar:', error);
                    document.getElementById('status').textContent = 'Error loading avatar: ' + error.message;
                }
            }

            // Change avatar function
            function changeAvatar(avatarType) {
                if (head && avatarUrls[avatarType]) {
                    loadAvatar(avatarType);
                }
            }

            // Test lip sync function
            function testLipSync() {
                if (!isAvatarReady || !head) {
                    alert('Avatar not ready yet');
                    return;
                }
                
                const testText = "Hello! This is a test of the enhanced lip sync functionality with TalkingHead.";
                head.speakText(testText, {
                    voice: 'alloy',
                    onStart: () => {
                        document.getElementById('status').textContent = 'Speaking...';
                    },
                    onEnd: () => {
                        document.getElementById('status').textContent = 'Avatar Ready';
                    }
                });
            }

            // Reset avatar function
            function resetAvatar() {
                if (head) {
                    head.resetAvatar();
                    document.getElementById('status').textContent = 'Avatar Reset';
                }
            }

            // Toggle subtitles
            function toggleSubtitles() {
                if (head) {
                    subtitlesEnabled = !subtitlesEnabled;
                    head.showSubtitles = subtitlesEnabled;
                    document.getElementById('status').textContent = subtitlesEnabled ? 'Subtitles: ON' : 'Subtitles: OFF';
                }
            }

            // Enhanced function to speak with custom lip sync data
            function speakWithLipSync(text, lipSyncData) {
                if (!isAvatarReady || !head) {
                    console.error('Avatar not ready');
                    return;
                }

                if (lipSyncData && lipSyncData.type === 'visemes' && lipSyncData.timing && lipSyncData.timing.length > 0) {
                    // Use custom lip sync data with enhanced timing
                    const timing = lipSyncData.timing;
                    
                    // Convert to TalkingHead format with proper timing
                    const visemeData = timing.map(t => ({
                        viseme: t.phoneme,
                        time: t.start_time * 1000, // Convert to milliseconds
                        duration: t.duration * 1000
                    }));

                    // Add smooth transitions between visemes
                    const enhancedVisemes = [];
                    for (let i = 0; i < visemeData.length; i++) {
                        const current = visemeData[i];
                        enhancedVisemes.push(current);
                        
                        // Add transition viseme if there's a gap
                        if (i < visemeData.length - 1) {
                            const next = visemeData[i + 1];
                            const gap = next.time - (current.time + current.duration);
                            if (gap > 50) { // Gap larger than 50ms
                                enhancedVisemes.push({
                                    viseme: 'X', // Neutral viseme
                                    time: current.time + current.duration,
                                    duration: gap
                                });
                            }
                        }
                    }

                    head.speakVisemes(enhancedVisemes, {
                        onStart: () => {
                            document.getElementById('status').textContent = 'Speaking with custom lip sync...';
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'speaking_started',
                                    method: 'custom_lip_sync'
                                }));
                            }
                        },
                        onEnd: () => {
                            document.getElementById('status').textContent = 'Avatar Ready';
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'speaking_ended',
                                    method: 'custom_lip_sync'
                                }));
                            }
                        }
                    });
                } else {
                    // Fallback to default text-to-speech with enhanced settings
                    head.speakText(text, {
                        voice: 'alloy',
                        speed: 1.0,
                        pitch: 1.0,
                        onStart: () => {
                            document.getElementById('status').textContent = 'Speaking...';
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'speaking_started',
                                    method: 'tts'
                                }));
                            }
                        },
                        onEnd: () => {
                            document.getElementById('status').textContent = 'Avatar Ready';
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'speaking_ended',
                                    method: 'tts'
                                }));
                            }
                        }
                    });
                }
            }

            // Listen for messages from React Native
            window.addEventListener('message', function(event) {
                try {
                    const data = JSON.parse(event.data);
                    
                    switch (data.type) {
                        case 'speak':
                            speakWithLipSync(data.text, data.lipSyncData);
                            break;
                        case 'change_avatar':
                            if (data.avatarUrl) {
                                // Load custom avatar URL
                                avatarUrls.custom = data.avatarUrl;
                                changeAvatar('custom');
                            } else {
                                changeAvatar(data.avatarType || 'default');
                            }
                            break;
                        case 'reset':
                            resetAvatar();
                            break;
                        case 'set_mood':
                            if (head && data.mood) {
                                head.setMood(data.mood);
                            }
                            break;
                        case 'set_camera':
                            if (head && data.camera) {
                                head.setCamera(data.camera);
                            }
                            break;
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            });

            // Initialize when page loads
            window.addEventListener('load', initTalkingHead);
            
            // Handle errors gracefully
            window.addEventListener('error', function(event) {
                console.error('Global error:', event.error);
                document.getElementById('status').textContent = 'Error occurred. Please refresh.';
                document.getElementById('status').style.display = 'block';
            });
        </script>
    </body>
    </html>
  `;

  useEffect(() => {
    requestPermissions();
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setRecordingPermission(status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Microphone permission is required for voice input'
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${serverUrl}/api/voice/ws/v2v/${userId}`);
      
      ws.onopen = () => {
        console.log('Connected to V2V service');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onclose = () => {
        console.log('Disconnected from V2V service');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        Alert.alert('Connection Error', 'Failed to connect to V2V service');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      Alert.alert('Connection Error', 'Failed to create WebSocket connection');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'voice_response':
        setCurrentTranscript(data.transcript);
        setCurrentAIResponse(data.ai_response);
        setConversationHistory(prev => [...prev, {
          timestamp: data.timestamp,
          user_input: data.transcript,
          ai_response: data.ai_response,
          type: 'voice'
        }]);
        setIsProcessing(false);
        
        // Send lip sync data to TalkingHead
        if (data.lip_sync_data && webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'speak',
            text: data.ai_response,
            lipSyncData: data.lip_sync_data
          }));
        }
        
        // Play audio response
        playAudioResponse(data.audio_response);
        break;
        
      case 'processing_status':
        if (data.status === 'processing') {
          setIsProcessing(true);
        }
        break;
        
      case 'conversation_history':
        setConversationHistory(data.history || []);
        break;
        
      case 'error':
        Alert.alert('Error', data.message);
        setIsProcessing(false);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = (type: 'voice_input' | 'text_input', payload: any) => {
    if (!wsRef.current || !isConnected) {
      Alert.alert('Not Connected', 'Please wait for connection to establish');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type,
      ...payload
    }));
  };

  const startRecording = async () => {
    try {
      if (recordingPermission !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is required for voice input');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      setCurrentTranscript('');
      setCurrentAIResponse('');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        // Convert audio to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64Audio = reader.result as string;
          const audioData = base64Audio.split(',')[1];
          
          sendMessage('voice_input', { audio_data: audioData });
        };
        
        reader.readAsDataURL(blob);
      }
      
      setIsRecording(false);
      recordingRef.current = null;
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording');
    }
  };

  const sendTextMessage = () => {
    if (!inputText.trim()) return;
    
    sendMessage('text_input', { text: inputText });
    setConversationHistory(prev => [...prev, {
      timestamp: new Date().toISOString(),
      user_input: inputText,
      ai_response: '',
      type: 'text'
    }]);
    setInputText('');
  };

  const playAudioResponse = async (base64Audio: string) => {
    try {
      if (audioPlayerRef.current) {
        await audioPlayerRef.current.unloadAsync();
      }

      const audio = new Audio.Sound();
      await audio.loadAsync({ uri: `data:audio/wav;base64,${base64Audio}` });
      await audio.playAsync();
      
      audioPlayerRef.current = audio;
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const getConversationHistory = () => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'get_history' }));
    }
  };

  const clearHistory = () => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'clear_history' }));
      setConversationHistory([]);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'avatar_ready':
          setAvatarReady(true);
          break;
        case 'speaking_started':
          // Avatar started speaking
          break;
        case 'speaking_ended':
          // Avatar finished speaking
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const testLipSync = () => {
    if (webViewRef.current && avatarReady) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'speak',
        text: 'Hello! This is a test of the lip sync functionality.',
        lipSyncData: null
      }));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        
        <Text style={styles.title}>3D Avatar V2V Chat</Text>
        
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* 3D Avatar Container */}
      <View style={styles.avatarContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: talkingHeadHTML }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
        
        {!avatarReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading 3D Avatar...</Text>
          </View>
        )}
      </View>

      {/* Conversation Area */}
      <ScrollView style={styles.conversationContainer} showsVerticalScrollIndicator={false}>
        {conversationHistory.map((message, index) => (
          <View key={index} style={styles.messageContainer}>
            <View style={styles.userMessage}>
              <Text style={styles.messageText}>
                <Text style={styles.messageLabel}>You: </Text>
                {message.user_input}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            
            {message.ai_response && (
              <View style={styles.aiMessage}>
                <Text style={styles.messageText}>
                  <Text style={styles.messageLabel}>AI: </Text>
                  {message.ai_response}
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        ))}
        
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Text Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          maxLength={500}
          editable={isConnected && !isProcessing}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || !isConnected || isProcessing) && styles.sendButtonDisabled]}
          onPress={sendTextMessage}
          disabled={!inputText.trim() || !isConnected || isProcessing}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Voice Recording */}
      <View style={styles.voiceContainer}>
        <TouchableOpacity
          style={[
            styles.voiceButton, 
            isRecording && styles.recordingButton,
            (!isConnected || isProcessing) && styles.voiceButtonDisabled
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={!isConnected || isProcessing}
        >
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={32} 
            color="white" 
          />
        </TouchableOpacity>
        
        <Text style={styles.voiceButtonText}>
          {isRecording ? 'Stop Recording' : 'Создать'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, !isConnected && styles.controlButtonDisabled]}
          onPress={getConversationHistory}
          disabled={!isConnected}
        >
          <Text style={[styles.controlButtonText, !isConnected && styles.controlButtonTextDisabled]}>
            Get History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, !isConnected && styles.controlButtonDisabled]}
          onPress={clearHistory}
          disabled={!isConnected}
        >
          <Text style={[styles.controlButtonText, !isConnected && styles.controlButtonTextDisabled]}>
            Clear History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, !avatarReady && styles.controlButtonDisabled]}
          onPress={testLipSync}
          disabled={!avatarReady}
        >
          <Text style={[styles.controlButtonText, !avatarReady && styles.controlButtonTextDisabled]}>
            Test Lip Sync
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  avatarContainer: {
    height: 300,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  conversationContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    marginBottom: 8,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 20,
  },
  messageLabel: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  processingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: 'white',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  voiceContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  voiceButton: {
    backgroundColor: '#007AFF',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  voiceButtonDisabled: {
    backgroundColor: '#ccc',
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  controlButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  controlButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  controlButtonText: {
    color: '#333',
    fontSize: 14,
  },
  controlButtonTextDisabled: {
    color: '#999',
  },
});
