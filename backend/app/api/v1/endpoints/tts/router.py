from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core import get_db, get_current_user
from app.database.models import User
from .schema import TtsCreate, TtsUpdate, TtsResponse, TtsList
from .service import TtsService

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])


@router.post("/", response_model=TtsResponse)
async def create_tts(
    tts_data: TtsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new TTS record
    """
    return TtsService.create_tts(db, tts_data, current_user)


@router.get("/", response_model=TtsList)
async def get_ttss(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get TTS records for current user with pagination
    """
    return TtsService.get_ttss(db, current_user, page, size)


@router.get("/search", response_model=TtsList)
async def search_ttss(
    q: str = Query(..., min_length=1, description="Search text"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search TTS records by text content
    """
    return TtsService.get_ttss_by_text_search(db, current_user, q, page, size)


@router.get("/{tts_id}", response_model=TtsResponse)
async def get_tts(
    tts_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get TTS record by ID
    """
    return TtsService.get_tts(db, tts_id, current_user)


@router.put("/{tts_id}", response_model=TtsResponse)
async def update_tts(
    tts_id: int,
    tts_data: TtsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update TTS record by ID
    """
    return TtsService.update_tts(db, tts_id, tts_data, current_user)


@router.delete("/{tts_id}")
async def delete_tts(
    tts_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete TTS record by ID
    """
    TtsService.delete_tts(db, tts_id, current_user)
    return {"message": "TTS record deleted successfully"}
