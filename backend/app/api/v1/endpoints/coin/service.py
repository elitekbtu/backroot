from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import math

from app.database.models import Coin
from .schema import CoinCreate, CoinUpdate, CoinResponse, CoinList


class CoinService:
    @staticmethod
    def create_coin(db: Session, coin_data: CoinCreate) -> CoinResponse:
        """Create a new coin"""
        existing_coin = db.query(Coin).filter(Coin.symbol == coin_data.symbol).first()
        if existing_coin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coin with this symbol already exists"
            )
        
        new_coin = Coin(
            name=coin_data.name,
            symbol=coin_data.symbol,
            description=coin_data.description,
            ar_model_url=coin_data.ar_model_url,
            ar_scale=coin_data.ar_scale,
            ar_position_x=coin_data.ar_position_x,
            ar_position_y=coin_data.ar_position_y,
            ar_position_z=coin_data.ar_position_z,
            is_active=True,
            is_deleted=False
        )
        
        db.add(new_coin)
        db.commit()
        db.refresh(new_coin)
        
        return CoinResponse.model_validate(new_coin)
    
    @staticmethod
    def get_coin(db: Session, coin_id: int) -> CoinResponse:
        """Get coin by ID"""
        coin = db.query(Coin).filter(
            Coin.id == coin_id, 
            Coin.is_deleted == False
        ).first()
        
        if not coin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coin not found"
            )
        
        return CoinResponse.model_validate(coin)
    
    @staticmethod
    def get_coins(
        db: Session, 
        page: int = 1, 
        size: int = 10,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> CoinList:
        """Get coins with pagination and filtering"""
        query = db.query(Coin).filter(Coin.is_deleted == False)
        
        if is_active is not None:
            query = query.filter(Coin.is_active == is_active)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Coin.name.ilike(search_filter)) | 
                (Coin.symbol.ilike(search_filter)) |
                (Coin.description.ilike(search_filter))
            )
        
        total = query.count()
        
        offset = (page - 1) * size
        coins = query.offset(offset).limit(size).all()
        
        pages = math.ceil(total / size) if total > 0 else 1
        
        return CoinList(
            coins=[CoinResponse.model_validate(coin) for coin in coins],
            total=total,
            page=page,
            size=size,
            pages=pages
        )
    
    @staticmethod
    def update_coin(db: Session, coin_id: int, coin_data: CoinUpdate) -> CoinResponse:
        """Update coin by ID"""
        coin = db.query(Coin).filter(
            Coin.id == coin_id, 
            Coin.is_deleted == False
        ).first()
        
        if not coin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coin not found"
            )

        # Проверяем уникальность символа при обновлении
        if coin_data.symbol and coin_data.symbol != coin.symbol:
            existing_coin = db.query(Coin).filter(
                Coin.symbol == coin_data.symbol,
                Coin.id != coin_id
            ).first()
            if existing_coin:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coin with this symbol already exists"
                )

        update_data = coin_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(coin, field, value)
        
        db.commit()
        db.refresh(coin)
        
        return CoinResponse.model_validate(coin)
    
    @staticmethod
    def delete_coin(db: Session, coin_id: int) -> bool:
        """Soft delete coin by ID"""
        coin = db.query(Coin).filter(
            Coin.id == coin_id, 
            Coin.is_deleted == False
        ).first()
        
        if not coin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coin not found"
            )
        
        coin.is_deleted = True
        coin.is_active = False
        
        db.commit()
        return True
    
    @staticmethod
    def get_coin_by_symbol(db: Session, symbol: str) -> CoinResponse:
        """Get coin by symbol"""
        coin = db.query(Coin).filter(
            Coin.symbol == symbol.upper(),
            Coin.is_deleted == False,
            Coin.is_active == True
        ).first()
        
        if not coin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coin not found"
            )
        
        return CoinResponse.model_validate(coin)
    
    @staticmethod
    def get_active_coins_for_ar(db: Session) -> List[CoinResponse]:
        """Get all active coins for AR functionality"""
        coins = db.query(Coin).filter(
            Coin.is_deleted == False,
            Coin.is_active == True,
            Coin.ar_model_url.isnot(None)
        ).all()
        
        return [CoinResponse.model_validate(coin) for coin in coins]
