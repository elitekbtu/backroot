import json
import logging
import asyncio
import base64
from typing import Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from openai import AsyncOpenAI
from app.core.config import get_settings
from .schema import (
    RealtimeRequest, 
    RealtimeResponse, 
    RealtimeMessageType,
    RealtimeRequestType,
    RealtimeError
)

logger = logging.getLogger(__name__)
settings = get_settings()


class RealtimeService:
    """Service for handling OpenAI Realtime API connections."""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_REALTIME_MODEL
        self.active_connections: Dict[str, WebSocket] = {}
        self.openai_connections: Dict[str, Any] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        """Connect a user to the realtime service."""
        try:
            await websocket.accept()
            self.active_connections[user_id] = websocket
            
            # Initialize OpenAI Realtime connection
            await self._initialize_openai_connection(user_id)
            
            logger.info(f"User {user_id} connected to realtime service")
            
        except Exception as e:
            logger.error(f"Error connecting user {user_id}: {e}")
            await self._send_error(websocket, f"Connection failed: {str(e)}")
    
    async def disconnect(self, user_id: str) -> None:
        """Disconnect a user from the realtime service."""
        try:
            # Close OpenAI connection if exists
            if user_id in self.openai_connections:
                await self.openai_connections[user_id].aclose()
                del self.openai_connections[user_id]
            
            # Remove from active connections
            if user_id in self.active_connections:
                del self.active_connections[user_id]
            
            logger.info(f"User {user_id} disconnected from realtime service")
            
        except Exception as e:
            logger.error(f"Error disconnecting user {user_id}: {e}")
    
    async def handle_message(self, websocket: WebSocket, user_id: str, message: str) -> None:
        """Handle incoming WebSocket message."""
        try:
            # Parse the message
            data = json.loads(message)
            request = RealtimeRequest(**data)
            
            # Route the request
            if request.type == RealtimeRequestType.SESSION_UPDATE:
                await self._handle_session_update(user_id, request.session_update)
            elif request.type == RealtimeRequestType.CONVERSATION_ITEM_INPUT:
                await self._handle_conversation_input(user_id, request.conversation_item_input)
            elif request.type == RealtimeRequestType.CONVERSATION_ITEM_CREATE:
                await self._handle_conversation_create(user_id, request.conversation_item_create)
            elif request.type == RealtimeRequestType.CONVERSATION_ITEM_UPDATE:
                await self._handle_conversation_update(user_id, request.conversation_item_update)
            elif request.type == RealtimeRequestType.CONVERSATION_ITEM_DELETE:
                await self._handle_conversation_delete(user_id, request.conversation_item_delete)
            elif request.type == RealtimeRequestType.PING:
                await self._handle_ping(user_id, request.ping)
            else:
                await self._send_error(websocket, f"Unknown request type: {request.type}")
                
        except json.JSONDecodeError:
            await self._send_error(websocket, "Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling message for user {user_id}: {e}")
            await self._send_error(websocket, f"Message handling failed: {str(e)}")
    
    async def _initialize_openai_connection(self, user_id: str) -> None:
        """Initialize OpenAI Realtime API connection."""
        try:
            # Create OpenAI Realtime connection
            connection = await self.client.beta.realtime.connect(
                model=self.model,
                response_format={"type": "json"},
                input_audio_format="pcm16",
                output_audio_format="pcm16",
                input_audio_transcription={
                    "model": "whisper-1"
                },
                turn_detection={
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 500
                },
                tools=[],
                tool_choice="auto",
                temperature=0.8,
                max_response_output_tokens=4096,
                instructions="You are a helpful AI assistant. Respond naturally and conversationally.",
                voice="alloy",
                language="en"
            )
            
            self.openai_connections[user_id] = connection
            
            # Start listening for OpenAI responses
            asyncio.create_task(self._listen_to_openai(user_id))
            
        except Exception as e:
            logger.error(f"Error initializing OpenAI connection for user {user_id}: {e}")
            raise
    
    async def _listen_to_openai(self, user_id: str) -> None:
        """Listen for responses from OpenAI Realtime API."""
        try:
            connection = self.openai_connections.get(user_id)
            if not connection:
                return
            
            websocket = self.active_connections.get(user_id)
            if not websocket:
                return
            
            async for event in connection:
                await self._handle_openai_event(user_id, event, websocket)
                
        except Exception as e:
            logger.error(f"Error listening to OpenAI for user {user_id}: {e}")
            await self._send_error(self.active_connections.get(user_id), f"OpenAI connection error: {str(e)}")
    
    async def _handle_openai_event(self, user_id: str, event: Any, websocket: WebSocket) -> None:
        """Handle events from OpenAI Realtime API."""
        try:
            event_type = event.type
            
            if event_type == "session.update":
                response = RealtimeResponse(
                    type=RealtimeMessageType.SESSION_UPDATE,
                    session=event.session.model_dump() if hasattr(event, 'session') else None
                )
                await websocket.send_text(response.model_dump_json())
                
            elif event_type == "response.audio":
                response = RealtimeResponse(
                    type=RealtimeMessageType.RESPONSE_AUDIO,
                    response={
                        "audio": event.audio,
                        "timestamp": event.timestamp
                    }
                )
                await websocket.send_text(response.model_dump_json())
                
            elif event_type == "response.delta":
                response = RealtimeResponse(
                    type=RealtimeMessageType.RESPONSE_DELTA,
                    response={
                        "delta": event.delta.model_dump() if hasattr(event, 'delta') else None,
                        "timestamp": event.timestamp
                    }
                )
                await websocket.send_text(response.model_dump_json())
                
            elif event_type == "response.done":
                response = RealtimeResponse(
                    type=RealtimeMessageType.RESPONSE_DONE,
                    response={
                        "usage": event.usage.model_dump() if hasattr(event, 'usage') else None,
                        "timestamp": event.timestamp
                    }
                )
                await websocket.send_text(response.model_dump_json())
                
            elif event_type == "conversation.item.created":
                response = RealtimeResponse(
                    type=RealtimeMessageType.CONVERSATION_ITEM_CREATED,
                    conversation_item=event.item.model_dump() if hasattr(event, 'item') else None
                )
                await websocket.send_text(response.model_dump_json())
                
            elif event_type == "conversation.item.updated":
                response = RealtimeResponse(
                    type=RealtimeMessageType.CONVERSATION_ITEM_UPDATED,
                    conversation_item=event.item.model_dump() if hasattr(event, 'item') else None
                )
                await websocket.send_text(response.model_dump_json())
                
            elif event_type == "conversation.item.deleted":
                response = RealtimeResponse(
                    type=RealtimeMessageType.CONVERSATION_ITEM_DELETED,
                    conversation_item={"id": event.item_id} if hasattr(event, 'item_id') else None
                )
                await websocket.send_text(response.model_dump_json())
                
            elif event_type == "error":
                error_response = RealtimeError(
                    error={
                        "code": event.error.code if hasattr(event, 'error') else "unknown",
                        "message": event.error.message if hasattr(event, 'error') else "Unknown error"
                    }
                )
                await websocket.send_text(error_response.model_dump_json())
                
        except Exception as e:
            logger.error(f"Error handling OpenAI event for user {user_id}: {e}")
            await self._send_error(websocket, f"Event handling failed: {str(e)}")
    
    async def _handle_session_update(self, user_id: str, session_update: Any) -> None:
        """Handle session update request."""
        try:
            connection = self.openai_connections.get(user_id)
            if not connection:
                raise ValueError("No active OpenAI connection")
            
            # Send session update to OpenAI
            await connection.send({
                "type": "session.update",
                "session": session_update.model_dump() if session_update else {}
            })
            
        except Exception as e:
            logger.error(f"Error handling session update for user {user_id}: {e}")
            raise
    
    async def _handle_conversation_input(self, user_id: str, input_data: Any) -> None:
        """Handle conversation input request."""
        try:
            connection = self.openai_connections.get(user_id)
            if not connection:
                raise ValueError("No active OpenAI connection")
            
            # Send input to OpenAI
            input_payload = {
                "type": input_data.type,
            }
            
            if input_data.audio:
                input_payload["audio"] = input_data.audio
            if input_data.text:
                input_payload["text"] = input_data.text
                
            await connection.send(input_payload)
            
        except Exception as e:
            logger.error(f"Error handling conversation input for user {user_id}: {e}")
            raise
    
    async def _handle_conversation_create(self, user_id: str, create_data: Any) -> None:
        """Handle conversation item create request."""
        try:
            connection = self.openai_connections.get(user_id)
            if not connection:
                raise ValueError("No active OpenAI connection")
            
            await connection.send({
                "type": "conversation.item.create",
                "item": create_data.model_dump()
            })
            
        except Exception as e:
            logger.error(f"Error handling conversation create for user {user_id}: {e}")
            raise
    
    async def _handle_conversation_update(self, user_id: str, update_data: Any) -> None:
        """Handle conversation item update request."""
        try:
            connection = self.openai_connections.get(user_id)
            if not connection:
                raise ValueError("No active OpenAI connection")
            
            await connection.send({
                "type": "conversation.item.update",
                "item": update_data.model_dump()
            })
            
        except Exception as e:
            logger.error(f"Error handling conversation update for user {user_id}: {e}")
            raise
    
    async def _handle_conversation_delete(self, user_id: str, delete_data: Any) -> None:
        """Handle conversation item delete request."""
        try:
            connection = self.openai_connections.get(user_id)
            if not connection:
                raise ValueError("No active OpenAI connection")
            
            await connection.send({
                "type": "conversation.item.delete",
                "item_id": delete_data.item_id
            })
            
        except Exception as e:
            logger.error(f"Error handling conversation delete for user {user_id}: {e}")
            raise
    
    async def _handle_ping(self, user_id: str, ping_data: Any) -> None:
        """Handle ping request."""
        try:
            websocket = self.active_connections.get(user_id)
            if not websocket:
                return
            
            response = RealtimeResponse(
                type=RealtimeMessageType.PONG,
                timestamp=ping_data.timestamp if ping_data else None
            )
            await websocket.send_text(response.model_dump_json())
            
        except Exception as e:
            logger.error(f"Error handling ping for user {user_id}: {e}")
            raise
    
    async def _send_error(self, websocket: WebSocket, message: str) -> None:
        """Send error message to WebSocket."""
        try:
            error_response = RealtimeError(
                error={
                    "code": "internal_error",
                    "message": message
                }
            )
            await websocket.send_text(error_response.model_dump_json())
        except Exception as e:
            logger.error(f"Error sending error message: {e}")


# Global service instance
realtime_service = RealtimeService()