#!/usr/bin/env python3
"""
Simple test client for the Realtime API endpoint.
This demonstrates how to connect and interact with the realtime WebSocket.
"""

import asyncio
import json
import websockets
import base64
import wave
import io
import numpy as np


class RealtimeTestClient:
    """Test client for the Realtime API."""
    
    def __init__(self, base_url: str = "ws://localhost:8000"):
        self.base_url = base_url
        self.websocket = None
    
    async def connect(self, user_id: str = "test_user"):
        """Connect to the realtime WebSocket."""
        uri = f"{self.base_url}/api/v1/streaming/realtime/{user_id}"
        print(f"Connecting to {uri}...")
        
        try:
            self.websocket = await websockets.connect(uri)
            print("✅ Connected successfully!")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from the WebSocket."""
        if self.websocket:
            await self.websocket.close()
            print("🔌 Disconnected")
    
    async def send_session_update(self, voice: str = "alloy", language: str = "en"):
        """Send session update to configure the realtime session."""
        message = {
            "type": "session.update",
            "session_update": {
                "voice": voice,
                "language": language,
                "instructions": "You are a helpful AI assistant. Respond naturally and conversationally.",
                "temperature": 0.8,
                "max_response_output_tokens": 4096
            }
        }
        
        await self.websocket.send(json.dumps(message))
        print("📤 Sent session update")
    
    async def send_text_input(self, text: str):
        """Send text input to the AI."""
        message = {
            "type": "conversation.item.input",
            "conversation_item_input": {
                "type": "input_text",
                "text": text
            }
        }
        
        await self.websocket.send(json.dumps(message))
        print(f"📤 Sent text: {text}")
    
    async def send_audio_input(self, audio_data: bytes):
        """Send audio input to the AI."""
        # Encode audio as base64
        audio_b64 = base64.b64encode(audio_data).decode('utf-8')
        
        message = {
            "type": "conversation.item.input",
            "conversation_item_input": {
                "type": "input_audio_buffer",
                "audio": audio_b64
            }
        }
        
        await self.websocket.send(json.dumps(message))
        print("📤 Sent audio input")
    
    async def create_test_audio(self, duration: float = 2.0, frequency: float = 440.0):
        """Create a test audio signal for testing."""
        sample_rate = 16000
        samples = int(duration * sample_rate)
        
        # Generate a simple sine wave
        t = np.linspace(0, duration, samples, False)
        audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
        
        # Convert to 16-bit PCM
        audio_data = (audio_data * 32767).astype(np.int16)
        
        # Create WAV file in memory
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data.tobytes())
        
        return wav_buffer.getvalue()
    
    async def listen_for_responses(self):
        """Listen for responses from the AI."""
        print("👂 Listening for responses...")
        
        try:
            async for message in self.websocket:
                data = json.loads(message)
                message_type = data.get("type", "unknown")
                
                if message_type == "session.update":
                    print("📋 Session updated")
                    
                elif message_type == "response.audio":
                    print("🔊 Received audio response")
                    
                elif message_type == "response.delta":
                    delta = data.get("response", {}).get("delta", {})
                    if "content" in delta:
                        print(f"💬 AI: {delta['content']}", end="", flush=True)
                    
                elif message_type == "response.done":
                    print("\n✅ Response complete")
                    
                elif message_type == "conversation.item.created":
                    print("📝 Conversation item created")
                    
                elif message_type == "error":
                    error = data.get("error", {})
                    print(f"❌ Error: {error.get('message', 'Unknown error')}")
                    
                elif message_type == "pong":
                    print("🏓 Pong received")
                    
                else:
                    print(f"📨 Unknown message type: {message_type}")
                    
        except websockets.exceptions.ConnectionClosed:
            print("🔌 Connection closed")
        except Exception as e:
            print(f"❌ Error listening: {e}")
    
    async def send_ping(self):
        """Send a ping to test connection."""
        message = {
            "type": "ping",
            "ping": {
                "timestamp": asyncio.get_event_loop().time()
            }
        }
        
        await self.websocket.send(json.dumps(message))
        print("🏓 Sent ping")


async def main():
    """Main test function."""
    client = RealtimeTestClient()
    
    # Connect to the realtime endpoint
    if not await client.connect():
        return
    
    try:
        # Configure the session
        await client.send_session_update()
        await asyncio.sleep(1)
        
        # Send a ping to test connection
        await client.send_ping()
        await asyncio.sleep(1)
        
        # Send some text input
        await client.send_text_input("Hello! Can you hear me?")
        await asyncio.sleep(2)
        
        # Create and send test audio
        print("🎵 Creating test audio...")
        test_audio = await client.create_test_audio(duration=2.0, frequency=440.0)
        await client.send_audio_input(test_audio)
        await asyncio.sleep(3)
        
        # Listen for responses
        await client.listen_for_responses()
        
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await client.disconnect()


if __name__ == "__main__":
    print("🚀 Starting Realtime API Test Client")
    print("Make sure your backend server is running on localhost:8000")
    print("Press Ctrl+C to stop\n")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")