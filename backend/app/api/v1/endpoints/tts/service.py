from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import math
import base64

from app.database.models import Tts, User
from .schema import TtsCreate, TtsUpdate, TtsResponse, TtsList


class TtsService:
    @staticmethod
    def create_tts(db: Session, tts_data: TtsCreate, current_user: User) -> TtsResponse:
        """Create a new TTS record"""
        try:
            audio_bytes = base64.b64decode(tts_data.audio)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 audio data"
            )
        
        new_tts = Tts(
            user_id=current_user.id,
            text=tts_data.text,
            audio=audio_bytes
        )
        
        db.add(new_tts)
        db.commit()
        db.refresh(new_tts)
        
        response_tts = TtsResponse.from_orm(new_tts)
        response_tts.audio = base64.b64encode(new_tts.audio).decode('utf-8')
        
        return response_tts
    
    @staticmethod
    def get_tts(db: Session, tts_id: int, current_user: User) -> TtsResponse:
        """Get TTS record by ID"""
        tts = db.query(Tts).filter(
            Tts.id == tts_id,
            Tts.user_id == current_user.id
        ).first()
        
        if not tts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="TTS record not found"
            )
        
        response_tts = TtsResponse.from_orm(tts)
        response_tts.audio = base64.b64encode(tts.audio).decode('utf-8')
        
        return response_tts
    
    @staticmethod
    def get_ttss(
        db: Session, 
        current_user: User,
        page: int = 1, 
        size: int = 10
    ) -> TtsList:
        """Get TTS records for current user with pagination"""
        query = db.query(Tts).filter(Tts.user_id == current_user.id)
        
        total = query.count()

        offset = (page - 1) * size
        ttss = query.order_by(Tts.created_at.desc()).offset(offset).limit(size).all()
        
        pages = math.ceil(total / size) if total > 0 else 1
        
        tts_responses = []
        for tts in ttss:
            response_tts = TtsResponse.from_orm(tts)
            response_tts.audio = base64.b64encode(tts.audio).decode('utf-8')
            tts_responses.append(response_tts)
        
        return TtsList(
            ttss=tts_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
    
    @staticmethod
    def update_tts(db: Session, tts_id: int, tts_data: TtsUpdate, current_user: User) -> TtsResponse:
        """Update TTS record by ID"""
        tts = db.query(Tts).filter(
            Tts.id == tts_id,
            Tts.user_id == current_user.id
        ).first()
        
        if not tts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="TTS record not found"
            )

        update_data = tts_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tts, field, value)
        
        db.commit()
        db.refresh(tts)
        
        response_tts = TtsResponse.from_orm(tts)
        response_tts.audio = base64.b64encode(tts.audio).decode('utf-8')
        
        return response_tts
    
    @staticmethod
    def delete_tts(db: Session, tts_id: int, current_user: User) -> bool:
        """Delete TTS record by ID"""
        tts = db.query(Tts).filter(
            Tts.id == tts_id,
            Tts.user_id == current_user.id
        ).first()
        
        if not tts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="TTS record not found"
            )
        
        db.delete(tts)
        db.commit()
        return True
    
    @staticmethod
    def get_ttss_by_text_search(
        db: Session,
        current_user: User,
        search_text: str,
        page: int = 1,
        size: int = 10
    ) -> TtsList:
        """Search TTS records by text content"""
        query = db.query(Tts).filter(
            Tts.user_id == current_user.id,
            Tts.text.ilike(f"%{search_text}%")
        )
        
        total = query.count()
        
        offset = (page - 1) * size
        ttss = query.order_by(Tts.created_at.desc()).offset(offset).limit(size).all()
        
        pages = math.ceil(total / size) if total > 0 else 1
        
        tts_responses = []
        for tts in ttss:
            response_tts = TtsResponse.from_orm(tts)
            response_tts.audio = base64.b64encode(tts.audio).decode('utf-8')
            tts_responses.append(response_tts)
        
        return TtsList(
            ttss=tts_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )