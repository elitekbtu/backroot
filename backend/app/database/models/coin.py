from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Coin(Base):
    __tablename__ = "coins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    symbol = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # AR-специфичные поля
    ar_model_url = Column(String, nullable=True)  # URL к 3D модели для AR
    ar_scale = Column(Float, nullable=True, default=1.0)  # Масштаб модели в AR
    ar_position_x = Column(Float, nullable=True, default=0.0)
    ar_position_y = Column(Float, nullable=True, default=0.0)
    ar_position_z = Column(Float, nullable=True, default=0.0)
    
    # Метаданные
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
