from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core import get_db, get_current_user
from app.database.models import User
from .schema import UserCreate, UserUpdate, UserResponse, UserList, PasswordChange
from .service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new user
    """
    return UserService.create_user(db, user_data)


@router.get("/", response_model=UserList)
async def get_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get users with pagination and filtering
    """
    return UserService.get_users(db, page, size, is_active)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user profile
    """
    return UserService.get_current_user_profile(db, current_user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user by ID
    """
    return UserService.get_user(db, user_id)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update user by ID
    """
    return UserService.update_user(db, user_id, user_data)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update current user profile
    """
    return UserService.update_current_user(db, current_user, user_data)


@router.post("/me/change-password", response_model=UserResponse)
async def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Change current user password
    """
    return UserService.change_password(db, current_user, password_data)


@router.post("/me/deactivate")
async def deactivate_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deactivate current user account
    """
    UserService.deactivate_current_user(db, current_user)
    return {"message": "Account deactivated successfully"}


@router.post("/{user_id}/reactivate", response_model=UserResponse)
async def reactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reactivate user account (admin only)
    """
    return UserService.reactivate_user(db, user_id)


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete user by ID (soft delete)
    """
    UserService.delete_user(db, user_id)
    return {"message": "User deleted successfully"}
