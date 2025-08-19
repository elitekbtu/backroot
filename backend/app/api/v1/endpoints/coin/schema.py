from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Coin Schemas
class CoinBase(BaseModel):
    map_id: int
    latitude: float
    longitude: float

class CoinCreate(CoinBase):
    pass

class CoinUpdate(BaseModel):
    is_collected: Optional[bool] = None
    collected_by_id: Optional[int] = None
    collected_at: Optional[datetime] = None

class CoinResponse(CoinBase):
    id: int
    is_collected: bool
    collected_by_id: Optional[int] = None
    collected_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CoinList(BaseModel):
    items: List[CoinResponse]
    total: int
    page: int
    size: int
    pages: int