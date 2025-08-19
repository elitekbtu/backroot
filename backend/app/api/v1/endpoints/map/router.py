from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.core import get_db, get_current_user
from app.database.models import User, Map
from .schema import MapCreate, MapUpdate, MapResponse, MapList
from .service import MapService

router = APIRouter(prefix="/maps", tags=["Maps"])

@router.post("/", response_model=MapResponse)
async def create_map(
    map_data: MapCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new map
    """
    return MapService.create_map(db, map_data, current_user)

@router.get("/", response_model=MapList)
async def get_maps(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get maps with pagination
    """
    return MapService.get_maps(db, current_user, page, size)

@router.get("/search", response_model=MapList)
async def search_maps(
    q: str = Query(..., min_length=1, description="Search by map name or description"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search maps by name or description
    """
    return MapService.get_maps_by_search(db, current_user, q, page, size)

@router.get("/{map_id}", response_model=MapResponse)
async def get_map(
    map_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get map by ID
    """
    return MapService.get_map(db, map_id, current_user)

@router.put("/{map_id}", response_model=MapResponse)
async def update_map(
    map_id: int,
    map_data: MapUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update map by ID
    """
    return MapService.update_map(db, map_id, map_data, current_user)

@router.delete("/{map_id}")
async def delete_map(
    map_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete map by ID
    """
    MapService.delete_map(db, map_id, current_user)
    return {"message": "Map deleted successfully"}