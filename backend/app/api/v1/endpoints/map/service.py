from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List

from app.database.models import Map, User
from .schema import MapCreate, MapUpdate, MapResponse, MapList


class MapService:
    @staticmethod
    def create_map(db: Session, map_data: MapCreate, current_user: User) -> MapResponse:
        """Create a new map"""
        db_map = Map(**map_data.dict())
        db.add(db_map)
        db.commit()
        db.refresh(db_map)
        return MapResponse.from_orm(db_map)

    @staticmethod
    def get_maps(db: Session, current_user: User, page: int = 1, size: int = 10) -> MapList:
        """Get maps with pagination"""
        offset = (page - 1) * size
        
        # Get total count
        total = db.query(func.count(Map.id)).scalar()
        
        # Get maps with pagination
        maps = db.query(Map).offset(offset).limit(size).all()
        
        # Calculate pages
        pages = (total + size - 1) // size
        
        return MapList(
            items=[MapResponse.from_orm(map_obj) for map_obj in maps],
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    @staticmethod
    def get_maps_by_search(db: Session, current_user: User, query: str, page: int = 1, size: int = 10) -> MapList:
        """Search maps by name or description"""
        offset = (page - 1) * size
        
        # Search query
        search_filter = Map.name.ilike(f"%{query}%") | Map.description.ilike(f"%{query}%")
        
        # Get total count
        total = db.query(func.count(Map.id)).filter(search_filter).scalar()
        
        # Get maps with pagination and search
        maps = db.query(Map).filter(search_filter).offset(offset).limit(size).all()
        
        # Calculate pages
        pages = (total + size - 1) // size
        
        return MapList(
            items=[MapResponse.from_orm(map_obj) for map_obj in maps],
            total=total,
            page=page,
            size=size,
            pages=pages
        )

    @staticmethod
    def get_map(db: Session, map_id: int, current_user: User) -> MapResponse:
        """Get map by ID"""
        db_map = db.query(Map).filter(Map.id == map_id).first()
        if not db_map:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Map not found"
            )
        return MapResponse.from_orm(db_map)

    @staticmethod
    def update_map(db: Session, map_id: int, map_data: MapUpdate, current_user: User) -> MapResponse:
        """Update map by ID"""
        db_map = db.query(Map).filter(Map.id == map_id).first()
        if not db_map:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Map not found"
            )
        
        # Update only provided fields
        update_data = map_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_map, field, value)
        
        db.commit()
        db.refresh(db_map)
        return MapResponse.from_orm(db_map)

    @staticmethod
    def delete_map(db: Session, map_id: int, current_user: User) -> None:
        """Delete map by ID"""
        db_map = db.query(Map).filter(Map.id == map_id).first()
        if not db_map:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Map not found"
            )
        
        db.delete(db_map)
        db.commit()
