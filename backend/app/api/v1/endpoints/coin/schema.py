from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Coin Schemas
class CoinBase(BaseModel):
    map_id: int
    latitude: float
    longitude: float
    name: str
    description: str
    icon: str
    rarity: str
    points: int

class CoinCreate(CoinBase):
    pass

class CoinUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    rarity: Optional[str] = None
    points: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
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

class CoinWithDistance(CoinResponse):
    distance_meters: Optional[float] = None
    map_name: Optional[str] = None
    map_description: Optional[str] = None

class CoinList(BaseModel):
    items: List[CoinResponse]
    total: int
    page: int
    size: int
    pages: int

class CoinListWithDistance(BaseModel):
    items: List[CoinWithDistance]
    total: int
    page: int
    size: int
    pages: int