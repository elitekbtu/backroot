from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CoinBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    symbol: str = Field(..., min_length=1, max_length=10)
    description: Optional[str] = Field(None, max_length=1000)
    
    # AR-специфичные поля
    ar_model_url: Optional[str] = Field(None, max_length=500)
    ar_scale: Optional[float] = Field(1.0, ge=0.1, le=10.0)
    ar_position_x: Optional[float] = Field(0.0)
    ar_position_y: Optional[float] = Field(0.0)
    ar_position_z: Optional[float] = Field(0.0)


class CoinCreate(CoinBase):
    pass


class CoinUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    symbol: Optional[str] = Field(None, min_length=1, max_length=10)
    description: Optional[str] = Field(None, max_length=1000)
    ar_model_url: Optional[str] = Field(None, max_length=500)
    ar_scale: Optional[float] = Field(None, ge=0.1, le=10.0)
    ar_position_x: Optional[float] = None
    ar_position_y: Optional[float] = None
    ar_position_z: Optional[float] = None
    is_active: Optional[bool] = None


class CoinResponse(CoinBase):
    id: int
    is_active: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CoinList(BaseModel):
    coins: List[CoinResponse]
    total: int
    page: int
    size: int
    pages: int
