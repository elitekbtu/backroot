from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core import get_db, get_current_user
from app.database.models import User
from .schema import CoinCreate, CoinUpdate, CoinResponse, CoinList
from .service import CoinService

router = APIRouter(prefix="/coins", tags=["Coins"])

@router.post("/", response_model=CoinResponse)
async def create_coin(
    coin_data: CoinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new coin achievement
    """
    return CoinService.create_coin(db, coin_data, current_user)

@router.get("/", response_model=CoinList)
async def get_coins(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get coin achievements for current user with pagination
    """
    return CoinService.get_coins(db, current_user, page, size)

@router.get("/search", response_model=CoinList)
async def search_coins(
    q: str = Query(..., min_length=1, description="Search by map name or coin details"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search coin achievements by map name or details
    """
    return CoinService.get_coins_by_search(db, current_user, q, page, size)

@router.get("/{coin_id}", response_model=CoinResponse)
async def get_coin(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get coin achievement by ID
    """
    return CoinService.get_coin(db, coin_id, current_user)

@router.put("/{coin_id}", response_model=CoinResponse)
async def update_coin(
    coin_id: int,
    coin_data: CoinUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update coin achievement by ID
    """
    return CoinService.update_coin(db, coin_id, coin_data, current_user)

@router.delete("/{coin_id}")
async def delete_coin(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete coin achievement by ID
    """
    CoinService.delete_coin(db, coin_id, current_user)
    return {"message": "Coin deleted successfully"}