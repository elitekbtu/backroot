# coin.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Coin(Base):
    """Coin model representing a real-world AR achievement"""
    __tablename__ = "coins"

    id = Column(Integer, primary_key=True, index=True)
    map_id = Column(Integer, ForeignKey("maps.id"), nullable=False)  # Связь с картой
    latitude = Column(Float, nullable=False)  # Широта
    longitude = Column(Float, nullable=False)  # Долгота
    is_collected = Column(Boolean, default=False)  # Статус сбора
    collected_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Связь с пользователем
    collected_at = Column(DateTime, nullable=True)  # Время сбора
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    # Relationships
    map = relationship("Map", back_populates="coins")
    user = relationship("User", back_populates="coins")