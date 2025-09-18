from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class UserCoinCollection(Base):
    __tablename__ = "user_coin_collections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    coin_id = Column(Integer, ForeignKey("coins.id"), nullable=False, index=True)
    collected_at = Column(DateTime, nullable=False, default=func.now())
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    user = relationship("User", back_populates="coin_collections")
    coin = relationship("Coin", back_populates="user_collections")

    # Composite unique constraint to prevent duplicate collections
    __table_args__ = (
        {"extend_existing": True}
    )
