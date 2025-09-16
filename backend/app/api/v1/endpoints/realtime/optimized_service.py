import asyncio
import logging
import uuid
from typing import Dict, Any, Optional
from .schema import RealtimeSession, RealtimeMessage, MessageRole
from app.services.voice.realtime_client import OpenAIRealtimeClient

logger = logging.getLogger(__name__)


class OptimizedRealtimeService:
    """Optimized service using OpenAI Realtime API."""
    
    def __init__(self):
        self.active_sessions: Dict[str, RealtimeSession] = {}
        self.realtime_connections: Dict[str, Any] = {}
        self.realtime_clients: Dict[str, OpenAIRealtimeClient] = {}
    
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
        
        # Create OpenAI Realtime client for this session
        client = OpenAIRealtimeClient()
        self.realtime_clients[session_id] = client
        
        # Register event handlers
        client.register_handler("conversation.item.created", self._handle_conversation_item_created)
        client.register_handler("response.content_part.added", self._handle_response_content_added)
        client.register_handler("response.done", self._handle_response_done)
        client.register_handler("input_audio_buffer.speech_started", self._handle_speech_started)
        client.register_handler("input_audio_buffer.speech_stopped", self._handle_speech_stopped)
        client.register_handler("error", self._handle_error)
        
        logger.info(f"Created optimized realtime session {session_id} for user {user_id}")
        return session
    
    async def start_realtime_connection(self, session_id: str, websocket) -> bool:
        """Start the realtime connection for a session."""
        if session_id not in self.active_sessions:
            return False
        
        session = self.active_sessions[session_id]
        client = self.realtime_clients.get(session_id)
        
        if not client:
            return False
        
        # Store websocket for sending responses
        self.realtime_connections[session_id] = {
            "session": session,
            "websocket": websocket,
            "is_connected": True
        }
        
        # Connect to OpenAI Realtime API
        if not await client.connect():
            return False
        
        # Start session with instructions
        instructions = """You are a helpful AI assistant. You can have natural conversations with users. 
        Respond in a friendly, conversational manner. Keep responses concise but informative. 
        If the user speaks in Russian, respond in Russian. If they speak in English, respond in English."""
        
        if not await client.start_session(instructions):
            return False
        
        # Start listening for events in background
        asyncio.create_task(client.listen_for_events())
        
        logger.info(f"Started realtime connection for session {session_id}")
        return True
    
    async def send_audio_to_realtime(self, session_id: str, audio_data: bytes) -> bool:
        """Send audio data to the realtime connection."""
        if session_id not in self.realtime_connections:
            return False
        
        client = self.realtime_clients.get(session_id)
        if not client or not client.is_connected:
            return False
        
        try:
            # Send audio to OpenAI Realtime API
            success = await client.send_audio(audio_data)
            if success:
                logger.info(f"Sent audio to OpenAI Realtime API for session {session_id}")
            return success
        except Exception as e:
            logger.error(f"Error sending audio to realtime: {e}")
            return False
    
    async def commit_audio(self, session_id: str) -> bool:
        """Commit the audio buffer."""
        client = self.realtime_clients.get(session_id)
        if not client or not client.is_connected:
            return False
        
        return await client.commit_audio()
    
    async def create_response(self, session_id: str) -> bool:
        """Create a response from the model."""
        client = self.realtime_clients.get(session_id)
        if not client or not client.is_connected:
            return False
        
        return await client.create_response()
    
    async def end_session(self, session_id: str):
        """End a realtime session."""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.is_active = False
            del self.active_sessions[session_id]
        
        if session_id in self.realtime_connections:
            del self.realtime_connections[session_id]
        
        if session_id in self.realtime_clients:
            client = self.realtime_clients[session_id]
            await client.disconnect()
            del self.realtime_clients[session_id]
        
        logger.info(f"Ended session {session_id}")
    
    async def _handle_conversation_item_created(self, event: Dict[str, Any]):
        """Handle conversation item created event."""
        logger.info("Conversation item created")
    
    async def _handle_response_content_added(self, event: Dict[str, Any]):
        """Handle response content added event."""
        content = event.get("content", [])
        for item in content:
            if item.get("type") == "text":
                text = item.get("text", "")
                if text:
                    await self._send_text_to_frontend(event.get("session_id"), text)
            elif item.get("type") == "audio":
                audio_data = item.get("audio", "")
                if audio_data:
                    await self._send_audio_to_frontend(event.get("session_id"), audio_data)
    
    async def _handle_response_done(self, event: Dict[str, Any]):
        """Handle response done event."""
        logger.info("Response completed")
        # Send completion status to frontend
        await self._send_status_to_frontend(event.get("session_id"), "response_completed")
    
    async def _handle_speech_started(self, event: Dict[str, Any]):
        """Handle speech started event."""
        logger.info("Speech started")
        await self._send_status_to_frontend(event.get("session_id"), "speech_started")
    
    async def _handle_speech_stopped(self, event: Dict[str, Any]):
        """Handle speech stopped event."""
        logger.info("Speech stopped")
        await self._send_status_to_frontend(event.get("session_id"), "speech_stopped")
    
    async def _handle_error(self, event: Dict[str, Any]):
        """Handle error event."""
        error = event.get("error", {})
        logger.error(f"OpenAI Realtime API error: {error}")
        await self._send_error_to_frontend(event.get("session_id"), str(error))
    
    async def _send_text_to_frontend(self, session_id: str, text: str):
        """Send text response to frontend."""
        if session_id in self.realtime_connections:
            connection = self.realtime_connections[session_id]
            websocket = connection.get("websocket")
            if websocket:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "text",
                        "content": text,
                        "session_id": session_id
                    }))
                    logger.info(f"Sent text to frontend: {text[:50]}...")
                except Exception as e:
                    logger.error(f"Error sending text to frontend: {e}")
    
    async def _send_audio_to_frontend(self, session_id: str, audio_data: str):
        """Send audio response to frontend."""
        if session_id in self.realtime_connections:
            connection = self.realtime_connections[session_id]
            websocket = connection.get("websocket")
            if websocket:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "audio",
                        "audio_data": audio_data,
                        "format": "pcm16",
                        "session_id": session_id
                    }))
                    logger.info("Sent audio to frontend")
                except Exception as e:
                    logger.error(f"Error sending audio to frontend: {e}")
    
    async def _send_status_to_frontend(self, session_id: str, status: str):
        """Send status to frontend."""
        if session_id in self.realtime_connections:
            connection = self.realtime_connections[session_id]
            websocket = connection.get("websocket")
            if websocket:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "status",
                        "status": status,
                        "session_id": session_id
                    }))
                except Exception as e:
                    logger.error(f"Error sending status to frontend: {e}")
    
    async def _send_error_to_frontend(self, session_id: str, error: str):
        """Send error to frontend."""
        if session_id in self.realtime_connections:
            connection = self.realtime_connections[session_id]
            websocket = connection.get("websocket")
            if websocket:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "error": error,
                        "session_id": session_id
                    }))
                except Exception as e:
                    logger.error(f"Error sending error to frontend: {e}")


# Create global instance
optimized_realtime_service = OptimizedRealtimeService()