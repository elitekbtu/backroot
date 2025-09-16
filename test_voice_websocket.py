#!/usr/bin/env python3
"""
Test script for Voice WebSocket connection
"""

import asyncio
import json
import websockets
import base64
import wave
import io
import numpy as np


async def test_voice_websocket():
    """Test the voice WebSocket connection."""
    uri = "ws://localhost:8000/api/v1/voice/ws/v2v/3"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to Voice WebSocket")
            
            # Wait for connection status
            message = await websocket.recv()
            data = json.loads(message)
            print(f"📨 Received: {data}")
            
            # Send a text message
            text_message = {
                "type": "text_input",
                "text": "Hello! Can you hear me? Please respond with voice."
            }
            
            print("📤 Sending text message...")
            await websocket.send(json.dumps(text_message))
            
            # Wait for response
            print("👂 Waiting for response...")
            response = await websocket.recv()
            response_data = json.loads(response)
            print(f"📨 Response type: {response_data.get('type')}")
            
            if response_data.get('type') == 'voice_response':
                print(f"💬 AI Response: {response_data.get('ai_response')}")
                print(f"🎵 Audio response received: {len(response_data.get('audio_response', ''))} characters")
                print("✅ Voice response test successful!")
            else:
                print(f"❌ Unexpected response: {response_data}")
                
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    print("🎤 Testing Voice WebSocket Connection")
    print("Make sure your backend is running on localhost:8000")
    print()
    
    asyncio.run(test_voice_websocket())