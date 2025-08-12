from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SttBase(BaseModel):
    text: str = Field(..., min_length=1)


class SttCreate(SttBase):
    audio: str = Field(..., description="Base64 encoded audio data")


class SttUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1)


class SttResponse(SttBase):
    id: int
    user_id: int
    audio: str = Field(..., description="Base64 encoded audio data")
    created_at: datetime
    
    class Config:
        from_attributes = True


class SttList(BaseModel):
    stts: List[SttResponse]
    total: int
    page: int
    size: int
    pages: int
