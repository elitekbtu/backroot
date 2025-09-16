import logging
import base64
import io
from typing import Dict, Any
from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class OpenAIClient:
    """Client for OpenAI API interactions."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.gpt_model = settings.OPENAI_MODEL
        self.tts_model = settings.OPENAI_TTS_MODEL
        self.stt_model = settings.OPENAI_STT_MODEL
    
    async def generate_response(self, user_input: str, user_id: str, user_sessions: Dict) -> str:
        """Generate AI response using OpenAI GPT model."""
        try:
            # Get conversation context
            session = user_sessions.get(user_id, {})
            conversation_history = session.get("conversation_history", [])
            
            # Build conversation context
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant. Respond naturally and conversationally. Keep responses concise but helpful."
                }
            ]
            
            # Add recent conversation history (last 10 exchanges)
            for exchange in conversation_history[-10:]:
                messages.append({
                    "role": "user",
                    "content": exchange["user_input"]
                })
                messages.append({
                    "role": "assistant",
                    "content": exchange["ai_response"]
                })
            
            # Add current user input
            messages.append({
                "role": "user",
                "content": user_input
            })
            
            response = await self.client.chat.completions.create(
                model=self.gpt_model,
                messages=messages,
                max_tokens=150,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            raise ValueError(f"AI response generation failed: {e}")
    
    async def speech_to_text(self, audio_data: str) -> str:
        """Convert speech to text using OpenAI Whisper."""
        try:
            logger.info(f"Starting speech-to-text, audio data length: {len(audio_data)}")
            
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)
            logger.info(f"Decoded audio bytes length: {len(audio_bytes)}")
            
            # Create a proper file-like object for OpenAI
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = "audio.wav"  # OpenAI needs a filename
            
            response = await self.client.audio.transcriptions.create(
                model=self.stt_model,
                file=audio_file,
                response_format="text",
                language="en"  # Optional: specify language for better accuracy
            )
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error in speech-to-text: {e}")
            raise ValueError(f"Speech-to-text failed: {e}")
    
    async def text_to_speech(self, text: str) -> str:
        """Convert text to speech using OpenAI TTS."""
        try:
            # Validate text length (OpenAI TTS has limits)
            if len(text) > 4096:
                text = text[:4096] + "..."  # Truncate if too long
            
            response = await self.client.audio.speech.create(
                model=self.tts_model,
                voice="alloy",  # Options: alloy, echo, fable, onyx, nova, shimmer
                input=text,
                response_format="mp3",  # Options: mp3, opus, aac, flac
                speed=1.0  # Speed multiplier (0.25 to 4.0)
            )
            
            # Convert response to base64
            audio_bytes = response.read()
            
            # Encode as base64 for WebSocket transmission
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            return audio_b64
            
        except Exception as e:
            logger.error(f"Error in text-to-speech: {e}")
            raise ValueError(f"Text-to-speech failed: {e}")
    
    async def validate_api_key(self) -> bool:
        """Validate OpenAI API key."""
        try:
            # Try to make a simple API call
            await self.client.models.list()
            return True
        except Exception as e:
            logger.error(f"OpenAI API key validation failed: {e}")
            return False
    
    async def get_available_models(self) -> list:
        """Get list of available OpenAI models."""
        try:
            models = await self.client.models.list()
            return [model.id for model in models.data]
        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return []
    
    async def test_tts_model(self) -> bool:
        """Test if TTS model is available and working."""
        try:
            # Try to create a simple TTS request
            response = await self.client.audio.speech.create(
                model=self.tts_model,
                voice="alloy",
                input="Test",
                response_format="mp3"
            )
            return True
        except Exception as e:
            logger.error(f"TTS model test failed: {e}")
            return False
    
    async def test_stt_model(self) -> bool:
        """Test if STT model is available and working."""
        try:
            # Create a minimal test audio (1 second of silence)
            import numpy as np
            import wave
            
            sample_rate = 16000
            duration = 1
            samples = np.zeros(sample_rate * duration, dtype=np.int16)
            
            with io.BytesIO() as wav_io:
                with wave.open(wav_io, 'wb') as wav_file:
                    wav_file.setnchannels(1)
                    wav_file.setsampwidth(2)
                    wav_file.setframerate(sample_rate)
                    wav_file.writeframes(samples.tobytes())
                
                test_audio = wav_io.getvalue()
                test_audio_b64 = base64.b64encode(test_audio).decode('utf-8')
                
                # Try to transcribe
                await self.speech_to_text(test_audio_b64)
                return True
                
        except Exception as e:
            logger.error(f"STT model test failed: {e}")
            return False
