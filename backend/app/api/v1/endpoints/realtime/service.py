import logging
import base64
import io
import uuid
import asyncio
from typing import Optional, Dict, Any, List, AsyncGenerator
from .schema import RealtimeSession, RealtimeMessage, MessageRole, RealtimeResponse
from app.services.voice.openai_client import OpenAIClient
from pydub import AudioSegment

logger = logging.getLogger(__name__)


class AudioProcessor:
    """Simple audio processor without external dependencies."""
    
    def __init__(self):
        self.sample_rate = 16000  # Standard sample rate
        self.max_duration = 300   # 5 minutes max (OpenAI limit)
    
    async def prepare_audio_for_openai(self, audio_data: str, audio_format: str = "webm") -> bytes:
        """Prepare audio data for OpenAI Whisper API."""
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            logger.info(f"Decoded audio data, size: {len(audio_bytes)} bytes, format: {audio_format}")
            
            # Try to convert to WAV format for better OpenAI compatibility
            try:
                # For WebM, try to handle incomplete files
                if audio_format == "webm":
                    # Try to create a proper WebM file by adding minimal header if needed
                    try:
                        audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format=audio_format)
                    except Exception as webm_error:
                        logger.warning(f"WebM parsing failed: {webm_error}, trying raw audio data")
                        # If WebM parsing fails, try to treat as raw audio
                        try:
                            audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format="raw", 
                                                                  sample_width=2, channels=1, frame_rate=16000)
                        except:
                            # Last resort: return original bytes
                            return audio_bytes
                else:
                    audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format=audio_format)
                
                # Export as WAV with specific parameters for OpenAI
                wav_io = io.BytesIO()
                audio_segment.export(wav_io, format="wav", parameters=["-ac", "1", "-ar", "16000"])
                wav_bytes = wav_io.getvalue()
                
                logger.info(f"Converted audio to WAV, size: {len(wav_bytes)} bytes")
                return wav_bytes
            except Exception as conversion_error:
                logger.warning(f"Audio conversion failed: {conversion_error}, using original format")
                # If conversion fails, return the original audio bytes
                return audio_bytes
                
        except Exception as e:
            logger.error(f"Error preparing audio for OpenAI: {e}")
            raise ValueError(f"Audio preparation failed: {e}")
    
    async def validate_audio_format(self, audio_data: str) -> bool:
        """Validate audio format and size - simplified version."""
        try:
            # Decode base64
            audio_bytes = base64.b64decode(audio_data)
            
            # Check file size (max 25MB for OpenAI)
            if len(audio_bytes) > 25 * 1024 * 1024:
                return False
            
            # Basic validation - just check if it's valid base64
            return len(audio_bytes) > 0
            
        except Exception:
            return False
    
    async def optimize_audio_quality(self, audio_data: str) -> str:
        """Optimize audio quality - simplified version."""
        # Just return original data
        return audio_data
    
    async def get_audio_info(self, audio_data: str) -> dict:
        """Get basic audio info - simplified version."""
        try:
            audio_bytes = base64.b64decode(audio_data)
            return {
                "file_size_bytes": len(audio_bytes),
                "format": "unknown"
            }
        except Exception as e:
            logger.error(f"Error getting audio info: {e}")
            return {}
    
    async def convert_audio_format(self, audio_data: str, target_format: str = "wav") -> str:
        """Convert audio format - simplified version."""
        # Just return original data
        return audio_data


class RealtimeService:
    """Service for managing realtime voice conversations."""
    
    def __init__(self):
        self.active_sessions: Dict[str, RealtimeSession] = {}
        self.realtime_connections: Dict[str, Any] = {}
        self.audio_processor = AudioProcessor()
        self.openai_client = OpenAIClient()
    
    async def create_session(self, user_id: str) -> RealtimeSession:
        """Create a new realtime session."""
        session_id = str(uuid.uuid4())
        session = RealtimeSession(
            session_id=session_id,
            user_id=user_id,
            messages=[],
            is_active=True
        )
        self.active_sessions[session_id] = session
        logger.info(f"Created realtime session {session_id} for user {user_id}")
        return session
    
    async def end_session(self, session_id: str) -> bool:
        """End a realtime session."""
        if session_id in self.active_sessions:
            self.active_sessions[session_id].is_active = False
            del self.active_sessions[session_id]
            logger.info(f"Ended realtime session {session_id}")
            return True
        return False
    
    async def start_realtime_connection(self, session_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Start a realtime connection and yield events."""
        if session_id not in self.active_sessions:
            yield {"type": "error", "error": "Session not found"}
            return
        
        session = self.active_sessions[session_id]
        self.realtime_connections[session_id] = {
            "session": session,
            "is_connected": True
        }
        
        try:
            # Simulate realtime connection events
            yield {"type": "status", "status": "connected", "session_id": session_id}
            
            # Keep connection alive and yield periodic status updates
            while session_id in self.realtime_connections and self.realtime_connections[session_id]["is_connected"]:
                await asyncio.sleep(1)
                yield {"type": "status", "status": "active", "session_id": session_id}
                
        except Exception as e:
            logger.error(f"Error in realtime connection: {e}")
            yield {"type": "error", "error": str(e)}
        finally:
            if session_id in self.realtime_connections:
                del self.realtime_connections[session_id]
    
    async def send_audio_to_realtime(self, session_id: str, audio_data: str, audio_format: str = "webm") -> bool:
        """Send audio data to realtime connection."""
        if session_id not in self.realtime_connections:
            return False
        
        try:
            # Validate audio format
            if not await self.audio_processor.validate_audio_format(audio_data):
                logger.error("Invalid audio format")
                return False
            
            # Process audio with OpenAI
            processed_audio = await self.audio_processor.prepare_audio_for_openai(audio_data, audio_format)
            
            # Convert audio to text using OpenAI Whisper
            logger.info(f"Transcribing audio for session {session_id}")
            # Encode the audio bytes back to base64 for the OpenAI client
            audio_base64 = base64.b64encode(processed_audio).decode('utf-8')
            # Try different formats in order of compatibility
            formats_to_try = ["wav", "webm", "mp4", "ogg"]
            if audio_format in formats_to_try:
                formats_to_try.remove(audio_format)
                formats_to_try.insert(0, audio_format)
            
            transcript = None
            last_error = None
            
            for fmt in formats_to_try:
                try:
                    logger.info(f"Trying format: {fmt}")
                    transcript = await self.openai_client.speech_to_text(audio_base64, fmt)
                    logger.info(f"Success with format: {fmt}")
                    break
                except Exception as fmt_error:
                    logger.warning(f"Format {fmt} failed: {fmt_error}")
                    last_error = fmt_error
                    continue
            
            if transcript is None:
                raise last_error or Exception("All audio formats failed")
            logger.info(f"Transcribed text: {transcript}")
            
            # Add user message to session
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                session.messages.append(RealtimeMessage(
                    role=MessageRole.user,
                    content=transcript,
                    timestamp=str(asyncio.get_event_loop().time())
                ))
            
            # Generate AI response
            logger.info(f"Generating AI response for session {session_id}")
            ai_response = await self.openai_client.generate_response(
                transcript, 
                session.user_id, 
                {session_id: session.messages}
            )
            logger.info(f"AI response: {ai_response}")
            
            # Add AI message to session
            session.messages.append(RealtimeMessage(
                role=MessageRole.assistant,
                content=ai_response,
                timestamp=str(asyncio.get_event_loop().time())
            ))
            
            # Store the response in the connection for sending back to frontend
            self.realtime_connections[session_id]["text_response"] = ai_response
            
            logger.info(f"Processed audio and generated response for session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing audio: {e}")
            return False
    
    async def send_text_to_realtime(self, session_id: str, text: str) -> bool:
        """Send text message to realtime connection."""
        if session_id not in self.realtime_connections:
            return False
        
        try:
            # Add user message to session
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                session.messages.append(RealtimeMessage(
                    role=MessageRole.user,
                    content=text,
                    timestamp=str(asyncio.get_event_loop().time())
                ))
            
            logger.info(f"Processed text message for session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing text: {e}")
            return False


# Create the service instance
realtime_service = RealtimeService()