from sqlalchemy import Column, Integer, String, Boolean, Date, Float, DateTime, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class Tts(Base):
    __tablename__ = "ttss"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    text = Column(String, nullable=False)
    audio = Column(LargeBinary, nullable=False)

    created_at = Column(DateTime, nullable=False, default=func.now())

    user = relationship("User", back_populates="ttss")