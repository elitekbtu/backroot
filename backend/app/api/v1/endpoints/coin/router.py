from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

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
    Create a new coin
    """
    return CoinService.create_coin(db, coin_data)


@router.get("/", response_model=CoinList)
async def get_coins(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name, symbol or description"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get coins with pagination and filtering
    """
    return CoinService.get_coins(db, page, size, is_active, search)


@router.get("/ar", response_model=List[CoinResponse])
async def get_coins_for_ar(
    db: Session = Depends(get_db)
):
    """
    Get all active coins with AR models for AR functionality (public endpoint)
    """
    return CoinService.get_active_coins_for_ar(db)


@router.get("/symbol/{symbol}", response_model=CoinResponse)
async def get_coin_by_symbol(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get coin by symbol
    """
    return CoinService.get_coin_by_symbol(db, symbol)


@router.get("/{coin_id}", response_model=CoinResponse)
async def get_coin(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get coin by ID
    """
    return CoinService.get_coin(db, coin_id)


@router.put("/{coin_id}", response_model=CoinResponse)
async def update_coin(
    coin_id: int,
    coin_data: CoinUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update coin by ID
    """
    return CoinService.update_coin(db, coin_id, coin_data)


@router.delete("/{coin_id}")
async def delete_coin(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete coin by ID (soft delete)
    """
    CoinService.delete_coin(db, coin_id)
    return {"message": "Coin deleted successfully"}
