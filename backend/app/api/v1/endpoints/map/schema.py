from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Map Schemas
class MapBase(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    is_active: bool = True

class MapCreate(MapBase):
    pass

class MapUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None

class MapResponse(MapBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MapList(BaseModel):
    items: List[MapResponse]
    total: int
    page: int
    size: int
    pages: int