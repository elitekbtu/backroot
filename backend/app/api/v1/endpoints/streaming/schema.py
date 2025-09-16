from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum


class RealtimeMessageType(str, Enum):
    """Types of realtime messages."""
    SESSION_UPDATE = "session.update"
    RESPONSE_AUDIO = "response.audio"
    RESPONSE_DELTA = "response.delta"
    RESPONSE_DONE = "response.done"
    CONVERSATION_ITEM_CREATED = "conversation.item.created"
    CONVERSATION_ITEM_UPDATED = "conversation.item.updated"
    CONVERSATION_ITEM_DELETED = "conversation.item.deleted"
    ERROR = "error"
    PING = "ping"
    PONG = "pong"


class RealtimeRequestType(str, Enum):
    """Types of realtime requests."""
    SESSION_UPDATE = "session.update"
    CONVERSATION_ITEM_INPUT = "conversation.item.input"
    CONVERSATION_ITEM_CREATE = "conversation.item.create"
    CONVERSATION_ITEM_UPDATE = "conversation.item.update"
    CONVERSATION_ITEM_DELETE = "conversation.item.delete"
    PING = "ping"


class RealtimeSessionUpdate(BaseModel):
    """Session update request."""
    turn_detection: Optional[Dict[str, Any]] = None
    input_audio_format: Optional[str] = None
    output_audio_format: Optional[str] = None
    input_audio_transcription: Optional[Dict[str, Any]] = None
    tools: Optional[List[Dict[str, Any]]] = None
    tool_choice: Optional[str] = None
    temperature: Optional[float] = None
    max_response_output_tokens: Optional[int] = None
    instructions: Optional[str] = None
    voice: Optional[str] = None
    model: Optional[str] = None
    language: Optional[str] = None


class RealtimeConversationItemInput(BaseModel):
    """Conversation item input request."""
    type: str = "input_audio_buffer"
    audio: Optional[str] = None  # Base64 encoded audio
    text: Optional[str] = None


class RealtimeConversationItemCreate(BaseModel):
    """Conversation item create request."""
    type: str = "message"
    role: str = "user"
    content: List[Dict[str, Any]]


class RealtimeConversationItemUpdate(BaseModel):
    """Conversation item update request."""
    item_id: str
    type: Optional[str] = None
    role: Optional[str] = None
    content: Optional[List[Dict[str, Any]]] = None


class RealtimeConversationItemDelete(BaseModel):
    """Conversation item delete request."""
    item_id: str


class RealtimePing(BaseModel):
    """Ping request."""
    timestamp: Optional[float] = None


class RealtimeRequest(BaseModel):
    """Base realtime request."""
    type: RealtimeRequestType
    session_update: Optional[RealtimeSessionUpdate] = None
    conversation_item_input: Optional[RealtimeConversationItemInput] = None
    conversation_item_create: Optional[RealtimeConversationItemCreate] = None
    conversation_item_update: Optional[RealtimeConversationItemUpdate] = None
    conversation_item_delete: Optional[RealtimeConversationItemDelete] = None
    ping: Optional[RealtimePing] = None


class RealtimeResponse(BaseModel):
    """Base realtime response."""
    type: RealtimeMessageType
    session: Optional[Dict[str, Any]] = None
    response: Optional[Dict[str, Any]] = None
    conversation_item: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    timestamp: Optional[float] = None


class RealtimeError(BaseModel):
    """Realtime error response."""
    type: str = "error"
    error: Dict[str, Any]


class RealtimeConnectionInfo(BaseModel):
    """Connection information for realtime WebSocket."""
    user_id: str
    session_id: Optional[str] = None
    model: Optional[str] = None
    voice: Optional[str] = None
    language: Optional[str] = None