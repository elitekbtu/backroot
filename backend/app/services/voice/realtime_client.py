import asyncio
import json
import logging
import websockets
from typing import Dict, Any, Callable, Optional
from app.core.config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)


class OpenAIRealtimeClient:
    """Client for OpenAI Realtime API using WebSocket connection."""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_REALTIME_MODEL
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.is_connected = False
        self.event_handlers: Dict[str, Callable] = {}
        
    async def connect(self) -> bool:
        """Connect to OpenAI Realtime API."""
        try:
            url = f"wss://api.openai.com/v1/realtime?model={self.model}"
            
            logger.info(f"Connecting to OpenAI Realtime API: {url}")
            self.websocket = await websockets.connect(
                url,
                additional_headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "OpenAI-Beta": "realtime=v1"
                }
            )
            self.is_connected = True
            logger.info("Connected to OpenAI Realtime API")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to OpenAI Realtime API: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from OpenAI Realtime API."""
        if self.websocket:
            await self.websocket.close()
            self.is_connected = False
            logger.info("Disconnected from OpenAI Realtime API")
    
    async def send_event(self, event: Dict[str, Any]) -> bool:
        """Send an event to the Realtime API."""
        if not self.is_connected or not self.websocket:
            logger.error("Not connected to OpenAI Realtime API")
            return False
        
        try:
            await self.websocket.send(json.dumps(event))
            logger.debug(f"Sent event: {event['type']}")
            return True
        except Exception as e:
            logger.error(f"Failed to send event: {e}")
            return False
    
    async def listen_for_events(self):
        """Listen for events from the Realtime API."""
        if not self.websocket:
            return
        
        try:
            async for message in self.websocket:
                try:
                    event = json.loads(message)
                    await self._handle_event(event)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse event: {e}")
                except Exception as e:
                    logger.error(f"Error handling event: {e}")
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self.is_connected = False
        except Exception as e:
            logger.error(f"Error listening for events: {e}")
            self.is_connected = False
    
    async def _handle_event(self, event: Dict[str, Any]):
        """Handle incoming events from the Realtime API."""
        event_type = event.get("type")
        logger.debug(f"Received event: {event_type}")
        
        # Call registered handler if exists
        if event_type in self.event_handlers:
            try:
                await self.event_handlers[event_type](event)
            except Exception as e:
                logger.error(f"Error in event handler for {event_type}: {e}")
        
        # Handle specific events
        if event_type == "session.created":
            logger.info("Session created successfully")
        elif event_type == "error":
            logger.error(f"OpenAI Realtime API error: {event.get('error', {})}")
        elif event_type == "conversation.item.created":
            logger.info("Conversation item created")
        elif event_type == "response.done":
            logger.info("Response completed")
    
    def register_handler(self, event_type: str, handler: Callable):
        """Register an event handler."""
        self.event_handlers[event_type] = handler
    
    async def start_session(self, instructions: str = None) -> bool:
        """Start a new session with the Realtime API."""
        if not self.is_connected:
            if not await self.connect():
                return False
        
        # Send session update with instructions
        session_config = {
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": instructions or "You are a helpful AI assistant. Respond naturally and conversationally.",
                "voice": "alloy",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1"
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 200
                },
                "tools": [],
                "tool_choice": "auto",
                "temperature": 0.8,
                "max_response_output_tokens": 4096
            }
        }
        
        return await self.send_event(session_config)
    
    async def send_audio(self, audio_data: bytes) -> bool:
        """Send audio data to the Realtime API."""
        import base64
        from pydub import AudioSegment
        import io
        
        try:
            # Convert audio to PCM16 mono at 24kHz as required by OpenAI Realtime API
            audio_segment = AudioSegment.from_file(io.BytesIO(audio_data), format="webm")
            
            # Convert to mono, 24kHz, 16-bit PCM
            audio_segment = audio_segment.set_channels(1)  # Mono
            audio_segment = audio_segment.set_frame_rate(24000)  # 24kHz
            audio_segment = audio_segment.set_sample_width(2)  # 16-bit
            
            # Export as raw PCM16
            pcm_data = audio_segment.raw_data
            
            event = {
                "type": "input_audio_buffer.append",
                "audio": base64.b64encode(pcm_data).decode('utf-8')
            }
            
            logger.info(f"Sending PCM16 audio: {len(pcm_data)} bytes")
            return await self.send_event(event)
            
        except Exception as e:
            logger.error(f"Error converting audio to PCM16: {e}")
            return False
    
    async def commit_audio(self) -> bool:
        """Commit the audio buffer."""
        event = {
            "type": "input_audio_buffer.commit"
        }
        
        return await self.send_event(event)
    
    async def create_response(self) -> bool:
        """Create a response from the model."""
        event = {
            "type": "response.create"
        }
        
        return await self.send_event(event)
    
    async def cancel_response(self) -> bool:
        """Cancel the current response."""
        event = {
            "type": "response.cancel"
        }
        
        return await self.send_event(event)