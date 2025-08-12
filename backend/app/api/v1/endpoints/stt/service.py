from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import math
import base64

from app.database.models import Stt, User
from .schema import SttCreate, SttUpdate, SttResponse, SttList


class SttService:
    @staticmethod
    def create_stt(db: Session, stt_data: SttCreate, current_user: User) -> SttResponse:
        """Create a new STT record"""
        try:
            audio_bytes = base64.b64decode(stt_data.audio)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 audio data"
            )
        
        new_stt = Stt(
            user_id=current_user.id,
            text=stt_data.text,
            audio=audio_bytes
        )
        
        db.add(new_stt)
        db.commit()
        db.refresh(new_stt)
        
        response_stt = SttResponse.from_orm(new_stt)
        response_stt.audio = base64.b64encode(new_stt.audio).decode('utf-8')
        
        return response_stt
    
    @staticmethod
    def get_stt(db: Session, stt_id: int, current_user: User) -> SttResponse:
        """Get STT record by ID"""
        stt = db.query(Stt).filter(
            Stt.id == stt_id,
            Stt.user_id == current_user.id
        ).first()
        
        if not stt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="STT record not found"
            )
        
        response_stt = SttResponse.from_orm(stt)
        response_stt.audio = base64.b64encode(stt.audio).decode('utf-8')
        
        return response_stt
    
    @staticmethod
    def get_stts(
        db: Session, 
        current_user: User,
        page: int = 1, 
        size: int = 10
    ) -> SttList:
        """Get STT records for current user with pagination"""
        query = db.query(Stt).filter(Stt.user_id == current_user.id)
        
        total = query.count()

        offset = (page - 1) * size
        stts = query.order_by(Stt.created_at.desc()).offset(offset).limit(size).all()
        
        pages = math.ceil(total / size) if total > 0 else 1
        
        stt_responses = []
        for stt in stts:
            response_stt = SttResponse.from_orm(stt)
            response_stt.audio = base64.b64encode(stt.audio).decode('utf-8')
            stt_responses.append(response_stt)
        
        return SttList(
            stts=stt_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
    
    @staticmethod
    def update_stt(db: Session, stt_id: int, stt_data: SttUpdate, current_user: User) -> SttResponse:
        """Update STT record by ID"""
        stt = db.query(Stt).filter(
            Stt.id == stt_id,
            Stt.user_id == current_user.id
        ).first()
        
        if not stt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="STT record not found"
            )

        update_data = stt_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(stt, field, value)
        
        db.commit()
        db.refresh(stt)
        
        response_stt = SttResponse.from_orm(stt)
        response_stt.audio = base64.b64encode(stt.audio).decode('utf-8')
        
        return response_stt
    
    @staticmethod
    def delete_stt(db: Session, stt_id: int, current_user: User) -> bool:
        """Delete STT record by ID"""
        stt = db.query(Stt).filter(
            Stt.id == stt_id,
            Stt.user_id == current_user.id
        ).first()
        
        if not stt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="STT record not found"
            )
        
        db.delete(stt)
        db.commit()
        return True
    
    @staticmethod
    def get_stts_by_text_search(
        db: Session,
        current_user: User,
        search_text: str,
        page: int = 1,
        size: int = 10
    ) -> SttList:
        """Search STT records by text content"""
        query = db.query(Stt).filter(
            Stt.user_id == current_user.id,
            Stt.text.ilike(f"%{search_text}%")
        )

        total = query.count()

        offset = (page - 1) * size
        stts = query.order_by(Stt.created_at.desc()).offset(offset).limit(size).all()
        
        pages = math.ceil(total / size) if total > 0 else 1
        
        stt_responses = []
        for stt in stts:
            response_stt = SttResponse.from_orm(stt)
            response_stt.audio = base64.b64encode(stt.audio).decode('utf-8')
            stt_responses.append(response_stt)
        
        return SttList(
            stts=stt_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
