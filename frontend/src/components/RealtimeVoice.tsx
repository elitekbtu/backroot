import React, { useState, useRef, useEffect } from 'react';

interface RealtimeVoiceProps {
  userId: string;
  apiBaseUrl?: string;
}

interface RealtimeMessage {
  type: string;
  session?: any;
  response?: any;
  conversation_item?: any;
  error?: any;
  timestamp?: number;
}

const RealtimeVoice: React.FC<RealtimeVoiceProps> = ({ 
  userId, 
  apiBaseUrl = 'ws://46.101.187.24:8000' 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // WebSocket connection
  const connectWebSocket = () => {
    const wsUrl = `${apiBaseUrl}/api/v1/streaming/realtime/${userId}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Connected to realtime API');
      setIsConnected(true);
      
      // Send session update
      sendSessionUpdate();
    };

    wsRef.current.onmessage = (event) => {
      const message: RealtimeMessage = JSON.parse(event.data);
      handleRealtimeMessage(message);
    };

    wsRef.current.onclose = () => {
      console.log('Disconnected from realtime API');
      setIsConnected(false);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Send session update
  const sendSessionUpdate = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'session.update',
        session_update: {
          voice: 'alloy',
          language: 'en',
          instructions: 'You are a helpful AI assistant. Respond naturally and conversationally.',
          temperature: 0.8,
          max_response_output_tokens: 4096
        }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  };

  // Handle realtime messages
  const handleRealtimeMessage = (message: RealtimeMessage) => {
    switch (message.type) {
      case 'session.update':
        console.log('Session updated');
        break;
        
      case 'response.audio':
        console.log('Received audio response');
        // Handle audio response here
        break;
        
      case 'response.delta':
        if (message.response?.delta?.content) {
          setCurrentResponse(prev => prev + message.response.delta.content);
        }
        break;
        
      case 'response.done':
        console.log('Response complete');
        setMessages(prev => [...prev, `AI: ${currentResponse}`]);
        setCurrentResponse('');
        break;
        
      case 'conversation.item.created':
        console.log('Conversation item created');
        break;
        
      case 'error':
        console.error('Error:', message.error?.message);
        setMessages(prev => [...prev, `Error: ${message.error?.message}`]);
        break;
        
      case 'pong':
        console.log('Pong received');
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Send text input
  const sendTextInput = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'conversation.item.input',
        conversation_item_input: {
          type: 'input_text',
          text: text
        }
      };
      wsRef.current.send(JSON.stringify(message));
      setMessages(prev => [...prev, `You: ${text}`]);
    }
  };

  // Send audio input
  const sendAudioInput = (audioBlob: Blob) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const reader = new FileReader();
      reader.onload = () => {
        const audioData = reader.result as string;
        const base64Audio = audioData.split(',')[1]; // Remove data:audio/wav;base64, prefix
        
        const message = {
          type: 'conversation.item.input',
          conversation_item_input: {
            type: 'input_audio_buffer',
            audio: base64Audio
          }
        };
        wsRef.current!.send(JSON.stringify(message));
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioInput(audioBlob);
        setMessages(prev => [...prev, 'You: [Audio message]']);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Send ping
  const sendPing = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'ping',
        ping: {
          timestamp: Date.now()
        }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Realtime Voice Chat</h2>
      
      {/* Connection Status */}
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Controls */}
      <div className="mb-4 space-x-2">
        <button
          onClick={isConnected ? disconnectWebSocket : connectWebSocket}
          className={`px-4 py-2 rounded ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
        
        <button
          onClick={sendPing}
          disabled={!isConnected}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded disabled:opacity-50"
        >
          Ping
        </button>
      </div>

      {/* Voice Controls */}
      <div className="mb-4 space-x-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isConnected}
          className={`px-4 py-2 rounded ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          } disabled:opacity-50`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      {/* Text Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const input = e.currentTarget.value.trim();
              if (input) {
                sendTextInput(input);
                e.currentTarget.value = '';
              }
            }
          }}
          disabled={!isConnected}
        />
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto border border-gray-300 rounded-md p-4 bg-gray-50">
        {messages.map((message, index) => (
          <div key={index} className="mb-2">
            {message}
          </div>
        ))}
        {currentResponse && (
          <div className="mb-2 text-blue-600">
            AI: {currentResponse}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeVoice;