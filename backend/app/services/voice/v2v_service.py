import json
import logging
from typing import Dict, Optional, Any
from datetime import datetime
from fastapi import WebSocket

from app.core.config import get_settings
from app.api.v1.endpoints.location.schema import LocationContext
from .openai_client import OpenAIClient
from .groq_client import GroqClient
from .audio_processor import AudioProcessor

logger = logging.getLogger(__name__)
settings = get_settings()


class V2VWebSocketService:
    """Voice-to-Voice WebSocket service using OpenAI models with TalkingHead lip-sync support."""
    
    def __init__(self):
        self.openai_client = OpenAIClient()
        self.groq_client = GroqClient()
        self.audio_processor = AudioProcessor()
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_sessions: Dict[str, Dict[str, Any]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        """Handle new WebSocket connection."""
        try:
            self.active_connections[user_id] = websocket
            self.user_sessions[user_id] = {
                "connected_at": datetime.utcnow(),
                "conversation_history": [],
                "is_processing": False,
                "location_context": None
            }
            
            await websocket.send_text(json.dumps({
                "type": "connection_status",
                "status": "connected",
                "message": "V2V connection established"
            }))
            
            logger.info(f"User {user_id} connected to V2V service")
            
        except Exception as e:
            logger.error(f"Error connecting user {user_id}: {e}")
            await websocket.close(1011, f"Connection error: {str(e)}")
    
    async def disconnect(self, user_id: str):
        """Handle WebSocket disconnection."""
        try:
            if user_id in self.active_connections:
                del self.active_connections[user_id]
            if user_id in self.user_sessions:
                del self.user_sessions[user_id]
            
            logger.info(f"User {user_id} disconnected from V2V service")
            
        except Exception as e:
            logger.error(f"Error disconnecting user {user_id}: {e}")
    
    async def handle_message(self, websocket: WebSocket, user_id: str, message: str):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            
            logger.info(f"Received message from user {user_id}, type: {message_type}")
            
            if message_type == "voice_input":
                await self.process_voice_input(websocket, user_id, data)
            elif message_type == "text_input":
                await self.process_text_input(websocket, user_id, data)
            elif message_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif message_type == "get_history":
                await self.send_conversation_history(websocket, user_id)
            elif message_type == "clear_history":
                await self.clear_conversation_history(websocket, user_id)
            elif message_type == "get_lip_sync_data":
                await self.send_lip_sync_data(websocket, user_id, data)
            elif message_type == "location_context":
                await self.update_location_context(websocket, user_id, data)
            else:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                }))
                
        except json.JSONDecodeError:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Invalid JSON format"
            }))
        except Exception as e:
            logger.error(f"Error handling message from user {user_id}: {e}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Internal server error: {str(e)}"
            }))
    
    async def process_voice_input(self, websocket: WebSocket, user_id: str, data: Dict):
        """Process voice input and generate voice response with lip-sync data."""
        try:
            if self.user_sessions[user_id]["is_processing"]:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Already processing a request. Please wait."
                }))
                return
            
            self.user_sessions[user_id]["is_processing"] = True
            
            # Send processing status
            await websocket.send_text(json.dumps({
                "type": "processing_status",
                "status": "processing",
                "message": "Processing voice input..."
            }))
            
            # Extract audio data and language
            audio_data = data.get("audio_data")
            language = data.get("language", "kk")  # Default to Kazakh
            if not audio_data:
                raise ValueError("No audio data provided")
            
            # Update language preference
            self.user_sessions[user_id]["language"] = language
            
            logger.info(f"Processing voice input for user {user_id}, audio data length: {len(audio_data) if audio_data else 0}")
            
            # Process audio through audio processor to convert format
            processed_audio = await self.audio_processor.prepare_audio_for_openai(audio_data)
            
            # Process audio and convert to text using OpenAIClient
            transcript = await self.openai_client.speech_to_text(processed_audio)
            
            # Generate AI response using Groq LLM with OpenAI fallback
            try:
                system_prompt = self._get_location_aware_prompt(user_id)
                ai_response = await self.groq_client.generate_response(transcript, user_id, self.user_sessions, system_prompt)
            except Exception as groq_error:
                logger.warning(f"Groq failed, falling back to OpenAI: {groq_error}")
                try:
                    system_prompt = self._get_location_aware_prompt(user_id)
                    ai_response = await self.openai_client.generate_response(transcript, user_id, self.user_sessions, system_prompt)
                except Exception as openai_error:
                    logger.error(f"Both Groq and OpenAI failed: {openai_error}")
                    # Fallback to basic prompt without location context
                    ai_response = await self.openai_client.generate_response(transcript, user_id, self.user_sessions)
            
            # Convert AI response to speech
            language = self.user_sessions[user_id].get("language", "kk")
            audio_response = await self.openai_client.text_to_speech(ai_response, language)
            
            # Generate lip-sync data for the AI response
            lip_sync_data = await self.generate_lip_sync_data(ai_response)
            
            # Update conversation history
            self.user_sessions[user_id]["conversation_history"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "user_input": transcript,
                "ai_response": ai_response,
                "type": "voice"
            })
            
            # Send response with lip-sync data
            await websocket.send_text(json.dumps({
                "type": "voice_response",
                "transcript": transcript,
                "ai_response": ai_response,
                "audio_response": audio_response,
                "lip_sync_data": lip_sync_data,
                "timestamp": datetime.utcnow().isoformat()
            }))
            
        except Exception as e:
            logger.error(f"Error processing voice input for user {user_id}: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Error processing voice input: {str(e)}"
            }))
        finally:
            self.user_sessions[user_id]["is_processing"] = False
    
    async def process_text_input(self, websocket: WebSocket, user_id: str, data: Dict):
        """Process text input and generate voice response with lip-sync data."""
        try:
            if self.user_sessions[user_id]["is_processing"]:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Already processing a request. Please wait."
                }))
                return
            
            self.user_sessions[user_id]["is_processing"] = True
            
            # Send processing status
            await websocket.send_text(json.dumps({
                "type": "processing_status",
                "status": "processing",
                "message": "Processing text input..."
            }))
            
            # Extract text, location context, and language
            text_input = data.get("text")
            location_context = data.get("location_context")
            language = data.get("language", "kk")  # Default to Kazakh
            
            if not text_input:
                raise ValueError("No text provided")
            
            # Update location context if provided
            if location_context:
                self.user_sessions[user_id]["location_context"] = location_context
            
            # Update language preference
            self.user_sessions[user_id]["language"] = language
            
            # Generate AI response using Groq LLM with OpenAI fallback
            try:
                system_prompt = self._get_location_aware_prompt(user_id)
                ai_response = await self.groq_client.generate_response(text_input, user_id, self.user_sessions, system_prompt)
            except Exception as groq_error:
                logger.warning(f"Groq failed, falling back to OpenAI: {groq_error}")
                try:
                    system_prompt = self._get_location_aware_prompt(user_id)
                    ai_response = await self.openai_client.generate_response(text_input, user_id, self.user_sessions, system_prompt)
                except Exception as openai_error:
                    logger.error(f"Both Groq and OpenAI failed: {openai_error}")
                    # Fallback to basic prompt without location context
                    ai_response = await self.openai_client.generate_response(text_input, user_id, self.user_sessions)
            
            # Convert AI response to speech
            language = self.user_sessions[user_id].get("language", "kk")
            audio_response = await self.openai_client.text_to_speech(ai_response, language)
            
            # Generate lip-sync data for the AI response
            lip_sync_data = await self.generate_lip_sync_data(ai_response)
            
            # Update conversation history
            self.user_sessions[user_id]["conversation_history"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "user_input": text_input,
                "ai_response": ai_response,
                "type": "text"
            })
            
            # Send response with lip-sync data
            await websocket.send_text(json.dumps({
                "type": "voice_response",
                "transcript": text_input,
                "ai_response": ai_response,
                "audio_response": audio_response,
                "lip_sync_data": lip_sync_data,
                "timestamp": datetime.utcnow().isoformat()
            }))
            
        except Exception as e:
            logger.error(f"Error processing text input for user {user_id}: {e}")
            logger.error(f"Exception type: {type(e)}")
            logger.error(f"Exception args: {e.args}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Error processing text input: {str(e)}"
            }))
        finally:
            self.user_sessions[user_id]["is_processing"] = False
    
    async def generate_lip_sync_data(self, text: str) -> Dict[str, Any]:
        """Generate lip-sync data for TalkingHead avatar."""
        try:
            # Enhanced phoneme mapping for better lip-sync
            phonemes = self._text_to_phonemes_enhanced(text)
            
            # Generate timing data based on text analysis
            words = text.split()
            word_count = len(words)
            
            # Calculate duration based on word count and complexity
            total_duration = self._calculate_speech_duration(text, word_count)
            
            lip_sync_data = {
                "type": "visemes",
                "visemes": phonemes,
                "timing": self._generate_enhanced_timing_data(phonemes, total_duration),
                "duration": total_duration,
                "language": "kk",  # Kazakh language
                "text": text,
                "word_count": word_count
            }
            
            return lip_sync_data
            
        except Exception as e:
            logger.error(f"Error generating lip-sync data: {e}")
            return {
                "type": "visemes",
                "visemes": [],
                "timing": [],
                "duration": 0,
                "language": "kk",  # Kazakh language
                "text": text,
                "word_count": len(text.split())
            }
    
    def _text_to_phonemes_enhanced(self, text: str) -> list:
        """Convert text to enhanced phonemes for better lip-sync."""
        # Enhanced phoneme mapping based on TalkingHead requirements
        # Includes both English and Kazakh sounds
        phoneme_map = {
            # English vowels
            'a': 'A', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
            # Kazakh vowels (Cyrillic)
            'а': 'A', 'ә': 'A', 'е': 'E', 'и': 'I', 'о': 'O', 'ө': 'O', 'ұ': 'U', 'ү': 'U', 'ы': 'I', 'і': 'I',
            # English consonants
            'b': 'B', 'p': 'B', 'm': 'B',  # Closed lips
            'f': 'F', 'v': 'F',  # Lower lip + upper teeth
            'w': 'W',  # Rounded lips
            'l': 'L',  # Tongue position
            'd': 'D', 't': 'D', 'n': 'D',  # Tongue tip
            'k': 'K', 'g': 'K', 'ng': 'K',  # Back of tongue
            's': 'S', 'z': 'S',  # Fricative
            'sh': 'SH', 'ch': 'SH', 'j': 'SH',  # Palatal
            'th': 'TH',  # Interdental
            'r': 'R',  # Retroflex
            'h': 'H',  # Glottal
            'y': 'Y',  # Palatal glide
            # Kazakh consonants (Cyrillic)
            'б': 'B', 'п': 'B', 'м': 'B',  # Closed lips
            'в': 'F', 'ф': 'F',  # Lower lip + upper teeth
            'л': 'L',  # Tongue position
            'д': 'D', 'т': 'D', 'н': 'D',  # Tongue tip
            'к': 'K', 'г': 'K', 'қ': 'K', 'ғ': 'K',  # Back of tongue
            'с': 'S', 'з': 'S', 'ц': 'S',  # Fricative
            'ш': 'SH', 'щ': 'SH', 'ч': 'SH', 'ж': 'SH',  # Palatal
            'р': 'R',  # Retroflex
            'х': 'H',  # Glottal
            'й': 'Y',  # Palatal glide
            'ң': 'N',  # Velar nasal
            'һ': 'H',  # Glottal fricative
        }
        
        phonemes = []
        text_lower = text.lower()
        i = 0
        
        while i < len(text_lower):
            # Check for two-character phonemes first
            if i < len(text_lower) - 1:
                two_char = text_lower[i:i+2]
                if two_char in phoneme_map:
                    phonemes.append(phoneme_map[two_char])
                    i += 2
                    continue
            
            # Single character phonemes
            char = text_lower[i]
            if char in phoneme_map:
                phonemes.append(phoneme_map[char])
            elif char.isalpha():
                # Default mapping for other letters (both English and Kazakh)
                if char in 'aeiouаәеиоөұүыі':
                    phonemes.append('A')  # Open mouth for vowels
                else:
                    phonemes.append('X')  # Neutral for consonants
            elif char.isspace():
                # Add small pause for spaces
                phonemes.append('P')
            
            i += 1
        
        return phonemes
    
    def _calculate_speech_duration(self, text: str, word_count: int) -> float:
        """Calculate speech duration based on text complexity."""
        # Base duration: 0.4 seconds per word
        base_duration = word_count * 0.4
        
        # Adjust for punctuation and complexity
        punctuation_count = sum(1 for char in text if char in '.,!?;:')
        complexity_factor = 1.0
        
        # Longer words take more time
        avg_word_length = sum(len(word) for word in text.split()) / max(word_count, 1)
        if avg_word_length > 8:
            complexity_factor += 0.2
        elif avg_word_length > 6:
            complexity_factor += 0.1
        
        # Punctuation adds pauses
        pause_time = punctuation_count * 0.2
        
        total_duration = (base_duration * complexity_factor) + pause_time
        
        return max(total_duration, 1.0)  # Minimum 1 second
    
    def _generate_enhanced_timing_data(self, phonemes: list, total_duration: float) -> list:
        """Generate enhanced timing data for phonemes."""
        if not phonemes:
            return []
        
        timing_data = []
        
        # Calculate phoneme durations based on phoneme type
        phoneme_durations = {}
        for phoneme in set(phonemes):
            if phoneme in ['A', 'E', 'I', 'O', 'U']:  # Vowels
                phoneme_durations[phoneme] = 0.15  # Longer for vowels
            elif phoneme in ['B', 'F', 'W']:  # Lip movements
                phoneme_durations[phoneme] = 0.12
            elif phoneme in ['L', 'R', 'Y']:  # Tongue movements
                phoneme_durations[phoneme] = 0.10
            elif phoneme == 'P':  # Pauses
                phoneme_durations[phoneme] = 0.08
            else:  # Default
                phoneme_durations[phoneme] = 0.10
        
        # Generate timing with proper durations
        current_time = 0.0
        for phoneme in phonemes:
            duration = phoneme_durations.get(phoneme, 0.10)
            
            timing_data.append({
                "phoneme": phoneme,
                "start_time": current_time,
                "duration": duration
            })
            
            current_time += duration
        
        # Normalize timing to fit total duration
        if current_time > 0:
            scale_factor = total_duration / current_time
            for timing in timing_data:
                timing["start_time"] *= scale_factor
                timing["duration"] *= scale_factor
        
        return timing_data
    
    async def send_lip_sync_data(self, websocket: WebSocket, user_id: str, data: Dict):
        """Send lip-sync data for a specific text."""
        try:
            text = data.get("text", "")
            if not text:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "No text provided for lip-sync generation"
                }))
                return
            
            lip_sync_data = await self.generate_lip_sync_data(text)
            
            await websocket.send_text(json.dumps({
                "type": "lip_sync_data",
                "text": text,
                "lip_sync_data": lip_sync_data
            }))
            
        except Exception as e:
            logger.error(f"Error sending lip-sync data for user {user_id}: {e}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Error generating lip-sync data: {str(e)}"
            }))
    
    async def send_conversation_history(self, websocket: WebSocket, user_id: str):
        """Send conversation history to the client."""
        try:
            session = self.user_sessions.get(user_id, {})
            history = session.get("conversation_history", [])
            
            await websocket.send_text(json.dumps({
                "type": "conversation_history",
                "history": history
            }))
            
        except Exception as e:
            logger.error(f"Error sending conversation history for user {user_id}: {e}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Error retrieving conversation history: {str(e)}"
            }))
    
    async def clear_conversation_history(self, websocket: WebSocket, user_id: str):
        """Clear conversation history for a user."""
        try:
            if user_id in self.user_sessions:
                self.user_sessions[user_id]["conversation_history"] = []
            
            await websocket.send_text(json.dumps({
                "type": "history_cleared",
                "message": "Conversation history cleared"
            }))
            
        except Exception as e:
            logger.error(f"Error clearing conversation history for user {user_id}: {e}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Error clearing conversation history: {str(e)}"
            }))
    
    async def get_conversation_history(self, user_id: str) -> list:
        """Get conversation history for a user."""
        session = self.user_sessions.get(user_id, {})
        return session.get("conversation_history", [])
    
    async def clear_conversation_history_by_id(self, user_id: str):
        """Clear conversation history for a user by ID."""
        if user_id in self.user_sessions:
            self.user_sessions[user_id]["conversation_history"] = []
    
    async def get_service_status(self) -> dict:
        """Get current service status including API health."""
        try:
            # Test Groq API
            groq_working = await self.groq_client.validate_api_key()
            
            # Test OpenAI API
            openai_working = await self.openai_client.test_tts_model()
            
            return {
                "status": "operational" if (groq_working or openai_working) else "error",
                "openai_api_key_valid": openai_working,
                "groq_api_key_valid": groq_working,
                "active_connections": len(self.active_connections),
                "active_sessions": len(self.user_sessions)
            }
        except Exception as e:
            logger.error(f"Error getting service status: {e}")
            return {
                "status": "error",
                "openai_api_key_valid": False,
                "groq_api_key_valid": False,
                "active_connections": len(self.active_connections),
                "active_sessions": len(self.user_sessions),
                "error": str(e)
            }

    async def test_models(self) -> dict:
        """Test if all models are working (Groq for LLM, OpenAI for TTS/STT)."""
        try:
            results = {
                "gpt_model": await self.groq_client.validate_api_key(),
                "tts_model": await self.openai_client.test_tts_model(),
                "stt_model": await self.openai_client.test_stt_model()
            }
            return results
        except Exception as e:
            logger.error(f"Error testing models: {e}")
            return {
                "gpt_model": False,
                "tts_model": False,
                "stt_model": False,
                "error": str(e)
            }

    async def update_location_context(self, websocket: WebSocket, user_id: str, data: Dict):
        """Update user's location context."""
        try:
            location_data = data.get("location_context")
            if location_data:
                # Store location context in user session
                self.user_sessions[user_id]["location_context"] = location_data
                
                await websocket.send_text(json.dumps({
                    "type": "location_context",
                    "location_context": location_data,
                    "message": "Location context updated successfully"
                }))
                
                logger.info(f"Updated location context for user {user_id}: {location_data.get('city', {}).get('name', 'Unknown')}")
            else:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "No location context provided"
                }))
                
        except Exception as e:
            logger.error(f"Error updating location context for user {user_id}: {e}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Failed to update location context: {str(e)}"
            }))

    def _get_location_aware_prompt(self, user_id: str) -> str:
        """Generate location-aware system prompt for AI."""
        # Get user's language preference
        language = "kk"  # Default to Kazakh
        if user_id in self.user_sessions:
            language = self.user_sessions[user_id].get("language", "kk")
        
        # Language-specific prompts
        language_prompts = {
            "kk": {
                "base": """You are a helpful AI assistant with voice-to-voice capabilities. You can speak naturally and have realistic lip-sync animations. You are designed to be conversational, helpful, and engaging.

IMPORTANT: You must respond in Kazakh language (қазақ тілі). All your responses should be in Kazakh, using proper Kazakh grammar and vocabulary.

Key capabilities:
- Voice-to-voice conversation with natural speech in Kazakh
- Realistic lip-sync animations that match your speech
- Context-aware responses based on conversation history
- Natural, conversational tone suitable for voice interaction in Kazakh

Guidelines:
- Always respond in Kazakh language
- Keep responses concise and natural for voice delivery
- Use appropriate pauses and emphasis
- Be helpful and engaging
- Ask follow-up questions when appropriate
- Maintain context throughout the conversation
- Use proper Kazakh grammar and vocabulary
- Be culturally appropriate for Kazakh speakers""",
                "location": "ЖЕРЛЕСУ КОНТЕКСТІ:"
            },
            "ru": {
                "base": """You are a helpful AI assistant with voice-to-voice capabilities. You can speak naturally and have realistic lip-sync animations. You are designed to be conversational, helpful, and engaging.

IMPORTANT: You must respond in Russian language (русский язык). All your responses should be in Russian, using proper Russian grammar and vocabulary.

Key capabilities:
- Voice-to-voice conversation with natural speech in Russian
- Realistic lip-sync animations that match your speech
- Context-aware responses based on conversation history
- Natural, conversational tone suitable for voice interaction in Russian

Guidelines:
- Always respond in Russian language
- Keep responses concise and natural for voice delivery
- Use appropriate pauses and emphasis
- Be helpful and engaging
- Ask follow-up questions when appropriate
- Maintain context throughout the conversation
- Use proper Russian grammar and vocabulary
- Be culturally appropriate for Russian speakers""",
                "location": "КОНТЕКСТ МЕСТОПОЛОЖЕНИЯ:"
            },
            "en": {
                "base": """You are a helpful AI assistant with voice-to-voice capabilities. You can speak naturally and have realistic lip-sync animations. You are designed to be conversational, helpful, and engaging.

IMPORTANT: You must respond in English language. All your responses should be in English, using proper English grammar and vocabulary.

Key capabilities:
- Voice-to-voice conversation with natural speech in English
- Realistic lip-sync animations that match your speech
- Context-aware responses based on conversation history
- Natural, conversational tone suitable for voice interaction in English

Guidelines:
- Always respond in English language
- Keep responses concise and natural for voice delivery
- Use appropriate pauses and emphasis
- Be helpful and engaging
- Ask follow-up questions when appropriate
- Maintain context throughout the conversation
- Use proper English grammar and vocabulary
- Be culturally appropriate for English speakers""",
                "location": "LOCATION CONTEXT:"
            }
        }
        
        prompt_data = language_prompts.get(language, language_prompts["kk"])
        base_prompt = prompt_data["base"]

        # Add location context if available
        if user_id in self.user_sessions:
            location_context = self.user_sessions[user_id].get("location_context")
            if location_context:
                logger.info(f"Location context for user {user_id}: {type(location_context)} - {location_context}")
                city_name = location_context.get("city", {}).get("name", "your location")
                country = location_context.get("city", {}).get("country", "")
                timezone = location_context.get("timezone", "")
                local_time = location_context.get("local_time", "")
                
                # Language-specific location context
                location_contexts = {
                    "kk": f"""

ЖЕРЛЕСУ КОНТЕКСТІ:
Сіз қазір {city_name}{f', {country}' if country else ''} қаласындасыз. Жергілікті уақыт {local_time} ({timezone}).

Жергілікті гид ретінде сіз көмектесе аласыз:
- Көруге болатын орындар, тамақтану және белсенділік ұсыныстары
- Бағыттар және көлік опциялары
- Жергілікті дәстүрлер, мәдениет және кеңестер
- Ауа-райы және маусымдық ақпарат
- Аймақ туралы тарихи және мәдени түсініктер
- Сатып алу, ойын-сауық және тамақтану ұсыныстары

Пайдаланушылар сұрағанда:
- "Мұнда не істеуге болады" немесе "көруге болатын орындар" - жергілікті көрікті жерлер мен белсенділіктерді ұсыну
- "Қайда тамақтануға болады" - жергілікті ресторандар мен тамақ тәжірибелерін ұсыну
- "Қалай жүруге болады" - көлік опциялары мен бағыттарды беру""",
                    "ru": f"""

КОНТЕКСТ МЕСТОПОЛОЖЕНИЯ:
Вы сейчас находитесь в городе {city_name}{f', {country}' if country else ''}. Местное время {local_time} ({timezone}).

Как местный гид, вы можете помочь:
- Рекомендации по достопримечательностям, ресторанам и развлечениям
- Направления и транспортные опции
- Местные традиции, культура и советы
- Погода и сезонная информация
- Историческая и культурная информация о регионе
- Рекомендации по шопингу, развлечениям и питанию

Когда пользователи спрашивают:
- "Что здесь можно делать" или "достопримечательности" - предложить местные достопримечательности и активности
- "Где поесть" - предложить местные рестораны и кулинарные впечатления
- "Как добраться" - предоставить транспортные опции и направления""",
                    "en": f"""

LOCATION CONTEXT:
You are currently in {city_name}{f', {country}' if country else ''}. Local time is {local_time} ({timezone}).

As a local guide, you can help with:
- Recommendations for attractions, dining, and activities
- Directions and transportation options
- Local traditions, culture, and tips
- Weather and seasonal information
- Historical and cultural information about the area
- Shopping, entertainment, and dining recommendations

When users ask:
- "What can I do here" or "attractions" - suggest local attractions and activities
- "Where to eat" - recommend local restaurants and culinary experiences
- "How to get there" - provide transportation options and directions"""
                }
                
                location_prompt = location_contexts.get(language, location_contexts["kk"])

                # Add attractions if available
                attractions = location_context.get("attractions", [])
                if attractions and isinstance(attractions, list) and len(attractions) > 0:
                    attraction_list = "\n".join([f"- {att['name']}: {att['description']}" for att in attractions[:5]])
                    location_prompt += f"""

ТАНЫМАЛ ЖЕРГІЛІКТІ КӨРІКТІ ЖЕРЛЕР:
{attraction_list}

Ұсыныстарда осы көрікті жерлерді қолданыңыз."""

                # Add transportation if available
                transportation = location_context.get("transportation", [])
                if transportation and isinstance(transportation, list) and len(transportation) > 0:
                    transport_list = "\n".join([f"- {trans['name']}: {trans['description']} ({trans['estimated_time']}, {trans.get('estimated_cost', 'Cost varies')})" for trans in transportation[:3]])
                    location_prompt += f"""

КӨЛІК ОПЦИЯЛАРЫ:
{transport_list}

Бағыттар мен жүруге көмектескенде осы ақпаратты пайдаланыңыз."""

                base_prompt += location_prompt

        return base_prompt


# Global instance
v2v_service = V2VWebSocketService()
