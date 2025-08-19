from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Boolean
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
    created_at = Column(DateTime, nullable=False, default=func.now())

    map = relationship("Map", back_populates="coins")
    user = relationship("User", back_populates="coins")  # Предполагаемая связь с User

# Предполагаемая модель User (добавьте в app/database/models/user.py)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    coins = relationship("Coin", back_populates="user")