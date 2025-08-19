from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base  
class Map(Base):
    """Map model representing a real-world geographic area"""
    __tablename__ = "maps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Название реальной локации
    created_at = Column(DateTime, nullable=False, default=func.now())

    coins = relationship("Coin", back_populates="map")