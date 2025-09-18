from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core import get_db, get_current_user
from app.database.models import User
from .schema import CoinCollectionCreate, CoinCollectionResponse, UserCoinCollectionSummary
from .service import CoinCollectionService

router = APIRouter(prefix="/coin-collections", tags=["Coin Collections"])

@router.post("/", response_model=CoinCollectionResponse)
async def collect_coin(
    collection_data: CoinCollectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Collect a coin for the current user
    """
    return CoinCollectionService.collect_coin(db, current_user.id, collection_data)

@router.get("/", response_model=List[CoinCollectionResponse])
async def get_user_collections(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's coin collections
    """
    return CoinCollectionService.get_user_collections(db, current_user.id, limit)

@router.get("/summary", response_model=UserCoinCollectionSummary)
async def get_user_collection_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's collection summary with statistics
    """
    return CoinCollectionService.get_user_collection_summary(db, current_user.id)

@router.get("/collected-ids", response_model=List[int])
async def get_collected_coin_ids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of collected coin IDs for the current user
    """
    return CoinCollectionService.get_collected_coin_ids(db, current_user.id)

@router.delete("/{collection_id}")
async def remove_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a coin collection (soft delete)
    """
    CoinCollectionService.remove_collection(db, current_user.id, collection_id)
    return {"message": "Collection removed successfully"}
