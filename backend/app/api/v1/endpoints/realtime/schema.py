from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum

class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"

class RealtimeMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: Optional[str] = None

class RealtimeSession(BaseModel):
    session_id: str
    user_id: str
    messages: List[RealtimeMessage] = []
    is_active: bool = True

class AudioChunk(BaseModel):
    data: str  # base64 encoded audio
    format: str = "wav"
    sample_rate: int = 16000

class RealtimeRequest(BaseModel):
    session_id: Optional[str] = None
    audio_chunk: Optional[AudioChunk] = None
    text_message: Optional[str] = None
    action: str  # "start", "audio", "text", "end"

class RealtimeResponse(BaseModel):
    type: str  # "audio", "text", "status", "error"
    content: Optional[str] = None
    audio_data: Optional[str] = None
    session_id: Optional[str] = None
    status: Optional[str] = None
    error: Optional[str] = None