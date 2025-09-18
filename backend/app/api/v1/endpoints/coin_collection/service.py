from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.database.models import UserCoinCollection, Coin, User
from .schema import CoinCollectionCreate, CoinCollectionResponse, CoinCollectionStats, UserCoinCollectionSummary

class CoinCollectionService:
    @staticmethod
    def collect_coin(db: Session, user_id: int, coin_data: CoinCollectionCreate) -> CoinCollectionResponse:
        """Collect a coin for a user"""
        # Check if coin exists and is active
        coin = db.query(Coin).filter(
            Coin.id == coin_data.coin_id,
            Coin.is_active == True,
            Coin.is_deleted == False
        ).first()
        
        if not coin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coin not found or inactive"
            )
        
        # Check if user already collected this coin
        existing_collection = db.query(UserCoinCollection).filter(
            and_(
                UserCoinCollection.user_id == user_id,
                UserCoinCollection.coin_id == coin_data.coin_id,
                UserCoinCollection.is_active == True
            )
        ).first()
        
        if existing_collection:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coin already collected"
            )
        
        # Create new collection
        new_collection = UserCoinCollection(
            user_id=user_id,
            coin_id=coin_data.coin_id,
            is_active=True
        )
        
        db.add(new_collection)
        db.commit()
        db.refresh(new_collection)
        
        return CoinCollectionResponse.model_validate(new_collection)
    
    @staticmethod
    def get_user_collections(db: Session, user_id: int, limit: int = 50) -> List[CoinCollectionResponse]:
        """Get user's coin collections"""
        collections = db.query(UserCoinCollection).filter(
            and_(
                UserCoinCollection.user_id == user_id,
                UserCoinCollection.is_active == True
            )
        ).order_by(UserCoinCollection.collected_at.desc()).limit(limit).all()
        
        return [CoinCollectionResponse.model_validate(collection) for collection in collections]
    
    @staticmethod
    def get_user_collection_stats(db: Session, user_id: int) -> CoinCollectionStats:
        """Get user's collection statistics"""
        # Get total collections
        total_collected = db.query(UserCoinCollection).filter(
            and_(
                UserCoinCollection.user_id == user_id,
                UserCoinCollection.is_active == True
            )
        ).count()
        
        # Get unique coins collected
        unique_coins = db.query(UserCoinCollection.coin_id).filter(
            and_(
                UserCoinCollection.user_id == user_id,
                UserCoinCollection.is_active == True
            )
        ).distinct().count()
        
        # Get total available coins
        total_available = db.query(Coin).filter(
            and_(
                Coin.is_active == True,
                Coin.is_deleted == False
            )
        ).count()
        
        # Calculate collection rate
        collection_rate = (unique_coins / total_available * 100) if total_available > 0 else 0
        
        return CoinCollectionStats(
            total_collected=total_collected,
            unique_coins=unique_coins,
            collection_rate=round(collection_rate, 2)
        )
    
    @staticmethod
    def get_user_collection_summary(db: Session, user_id: int) -> UserCoinCollectionSummary:
        """Get complete user collection summary"""
        stats = CoinCollectionService.get_user_collection_stats(db, user_id)
        recent_collections = CoinCollectionService.get_user_collections(db, user_id, 10)
        
        return UserCoinCollectionSummary(
            user_id=user_id,
            stats=stats,
            recent_collections=recent_collections
        )
    
    @staticmethod
    def remove_collection(db: Session, user_id: int, collection_id: int) -> bool:
        """Remove a coin collection (soft delete)"""
        collection = db.query(UserCoinCollection).filter(
            and_(
                UserCoinCollection.id == collection_id,
                UserCoinCollection.user_id == user_id,
                UserCoinCollection.is_active == True
            )
        ).first()
        
        if not collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found"
            )
        
        collection.is_active = False
        db.commit()
        return True
    
    @staticmethod
    def get_collected_coin_ids(db: Session, user_id: int) -> List[int]:
        """Get list of collected coin IDs for a user"""
        collections = db.query(UserCoinCollection.coin_id).filter(
            and_(
                UserCoinCollection.user_id == user_id,
                UserCoinCollection.is_active == True
            )
        ).all()
        
        return [collection.coin_id for collection in collections]
