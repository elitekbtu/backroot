from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import math
from datetime import datetime

from app.database.models import Coin, User, Map
from .schema import CoinCreate, CoinUpdate, CoinResponse, CoinList, CoinWithDistance, CoinListWithDistance

class CoinService:
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        R = 6371000  # Earth's radius in meters
        
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
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
        """Get all coin achievements with pagination"""
        query = db.query(Coin).join(Map)
        total = query.count()
        offset = (page - 1) * size
        coins = query.order_by(Coin.created_at.desc()).offset(offset).limit(size).all()
        pages = math.ceil(total / size) if total > 0 else 1
        return CoinList(items=[CoinResponse.from_orm(coin) for coin in coins], total=total, page=page, size=size, pages=pages)

    @staticmethod
    def get_coins_with_distance(
        db: Session, 
        current_user: User,
        user_lat: float,
        user_lon: float,
        page: int = 1, 
        size: int = 10
    ) -> CoinListWithDistance:
        """Get all coin achievements with distance from user location"""
        query = db.query(Coin).join(Map)
        total = query.count()
        offset = (page - 1) * size
        coins = query.order_by(Coin.created_at.desc()).offset(offset).limit(size).all()
        pages = math.ceil(total / size) if total > 0 else 1
        
        coins_with_distance = []
        for coin in coins:
            distance = CoinService.calculate_distance(
                user_lat, user_lon, coin.latitude, coin.longitude
            )
            
            coin_data = CoinWithDistance.from_orm(coin)
            coin_data.distance_meters = round(distance, 2)
            coin_data.map_name = coin.map.name if coin.map else None
            coin_data.map_description = coin.map.description if coin.map else None
            
            coins_with_distance.append(coin_data)
        
        return CoinListWithDistance(
            items=coins_with_distance, 
            total=total, 
            page=page, 
            size=size, 
            pages=pages
        )

    @staticmethod
    def collect_coin(
        db: Session,
        coin_id: int,
        current_user: User,
        user_lat: float,
        user_lon: float
    ) -> CoinResponse:
        """Collect a coin if user is within 50 meters"""
        coin = db.query(Coin).filter(Coin.id == coin_id).first()
        if not coin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coin not found"
            )
        
        if coin.is_collected:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coin already collected"
            )
        
        # Check distance
        distance = CoinService.calculate_distance(
            user_lat, user_lon, coin.latitude, coin.longitude
        )
        
        if distance > 50:  # 50 meters
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Too far from coin. Distance: {round(distance, 2)}m, required: 50m"
            )
        
        # Collect the coin
        coin.is_collected = True
        coin.collected_by_id = current_user.id
        coin.collected_at = datetime.utcnow()
        
        db.commit()
        db.refresh(coin)
        
        return CoinResponse.from_orm(coin)

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