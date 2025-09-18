from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CoinCollectionCreate(BaseModel):
    coin_id: int

class CoinCollectionResponse(BaseModel):
    id: int
    user_id: int
    coin_id: int
    collected_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class CoinCollectionStats(BaseModel):
    total_collected: int
    unique_coins: int
    collection_rate: float  # percentage of available coins collected

class UserCoinCollectionSummary(BaseModel):
    user_id: int
    stats: CoinCollectionStats
    recent_collections: list[CoinCollectionResponse]
