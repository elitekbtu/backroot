# map.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Map(Base):
    """Map model - represents AR map locations where coins are placed"""
    __tablename__ = "maps"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Map information
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # GPS coordinates of the map
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Map status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    coins = relationship("Coin", back_populates="map", cascade="all, delete-orphan")