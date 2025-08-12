from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TtsBase(BaseModel):
    text: str = Field(..., min_length=1)


class TtsCreate(TtsBase):
    audio: str = Field(..., description="Base64 encoded audio data")


class TtsUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1)


class TtsResponse(TtsBase):
    id: int
    user_id: int
    audio: str = Field(..., description="Base64 encoded audio data")
    created_at: datetime
    
    class Config:
        from_attributes = True


class TtsList(BaseModel):
    ttss: List[TtsResponse]
    total: int
    page: int
    size: int
    pages: int
