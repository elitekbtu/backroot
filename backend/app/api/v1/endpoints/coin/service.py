from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import math

from app.database.models import Coin, User, Map
from .schema import CoinCreate, CoinUpdate, CoinResponse, CoinList

class CoinService:
    @staticmethod
    def create_coin(db: Session, coin_data: CoinCreate, current_user: User) -> CoinResponse:
        """Create a new coin achievement"""
        new_coin = Coin(**coin_data.dict(), collected_by_id=None)
        db.add(new_coin)
        db.commit()
        db.refresh(new_coin)
        return CoinResponse.from_orm(new_coin)

    @staticmethod
    def get_coin(db: Session, coin_id: int, current_user: User) -> CoinResponse:
        """Get coin achievement by ID"""
        coin = db.query(Coin).filter(
            Coin.id == coin_id,
            Coin.map_id.in_(db.query(Map.id).filter(Map.coins.any(User.id == current_user.id)))
        ).first()
        if not coin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coin not found or access denied"
            )
        return CoinResponse.from_orm(coin)

    @staticmethod
    def get_coins(
        db: Session, 
        current_user: User,
        page: int = 1, 
        size: int = 10
    ) -> CoinList:
        """Get coin achievements for current user with pagination"""
        query = db.query(Coin).join(Map).filter(
            Coin.collected_by_id == current_user.id
        )
        total = query.count()
        offset = (page - 1) * size
        coins = query.order_by(Coin.created_at.desc()).offset(offset).limit(size).all()
        pages = math.ceil(total / size) if total > 0 else 1
        return CoinList(items=[CoinResponse.from_orm(coin) for coin in coins], total=total, page=page, size=size, pages=pages)

    @staticmethod
    def get_coins_by_search(
        db: Session,
        current_user: User,
        search_text: str,
        page: int = 1,
        size: int = 10
    ) -> CoinList:
        """Search coin achievements by map name or details"""
        query = db.query(Coin).join(Map).filter(
            Coin.collected_by_id == current_user.id,
            Map.name.ilike(f"%{search_text}%")
        )
        total = query.count()
        offset = (page - 1) * size
        coins = query.order_by(Coin.created_at.desc()).offset(offset).limit(size).all()
        pages = math.ceil(total / size) if total > 0 else 1
        return CoinList(items=[CoinResponse.from_orm(coin) for coin in coins], total=total, page=page, size=size, pages=pages)

    @staticmethod
    def update_coin(db: Session, coin_id: int, coin_data: CoinUpdate, current_user: User) -> CoinResponse:
        """Update coin achievement by ID"""
        coin = db.query(Coin).filter(
            Coin.id == coin_id,
            Coin.map_id.in_(db.query(Map.id).filter(Map.coins.any(User.id == current_user.id)))
        ).first()
        if not coin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coin not found or access denied"
            )
        update_data = coin_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(coin, field, value)
        db.commit()
        db.refresh(coin)
        return CoinResponse.from_orm(coin)

    @staticmethod
    def delete_coin(db: Session, coin_id: int, current_user: User) -> bool:
        """Delete coin achievement by ID"""
        coin = db.query(Coin).filter(
            Coin.id == coin_id,
            Coin.map_id.in_(db.query(Map.id).filter(Map.coins.any(User.id == current_user.id)))
        ).first()
        if not coin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coin not found or access denied"
            )
        db.delete(coin)
        db.commit()
        return True