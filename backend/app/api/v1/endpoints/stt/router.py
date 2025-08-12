from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core import get_db, get_current_user
from app.database.models import User
from .schema import SttCreate, SttUpdate, SttResponse, SttList
from .service import SttService

router = APIRouter(prefix="/stt", tags=["Speech-to-Text"])


@router.post("/", response_model=SttResponse)
async def create_stt(
    stt_data: SttCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new STT record
    """
    return SttService.create_stt(db, stt_data, current_user)


@router.get("/", response_model=SttList)
async def get_stts(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get STT records for current user with pagination
    """
    return SttService.get_stts(db, current_user, page, size)


@router.get("/search", response_model=SttList)
async def search_stts(
    q: str = Query(..., min_length=1, description="Search text"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search STT records by text content
    """
    return SttService.get_stts_by_text_search(db, current_user, q, page, size)


@router.get("/{stt_id}", response_model=SttResponse)
async def get_stt(
    stt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get STT record by ID
    """
    return SttService.get_stt(db, stt_id, current_user)


@router.put("/{stt_id}", response_model=SttResponse)
async def update_stt(
    stt_id: int,
    stt_data: SttUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update STT record by ID
    """
    return SttService.update_stt(db, stt_id, stt_data, current_user)


@router.delete("/{stt_id}")
async def delete_stt(
    stt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete STT record by ID
    """
    SttService.delete_stt(db, stt_id, current_user)
    return {"message": "STT record deleted successfully"}
