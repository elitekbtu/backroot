from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import math

from app.core.security import get_password_hash
from app.database.models import User
from .schema import UserCreate, UserUpdate, UserResponse, UserList


class UserService:
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> UserResponse:
        """Create a new user"""
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_active=True,
            is_deleted=False
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return UserResponse.from_orm(new_user)
    
    @staticmethod
    def get_user(db: Session, user_id: int) -> UserResponse:
        """Get user by ID"""
        user = db.query(User).filter(
            User.id == user_id, 
            User.is_deleted == False
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse.from_orm(user)
    
    @staticmethod
    def get_users(
        db: Session, 
        page: int = 1, 
        size: int = 10,
        is_active: Optional[bool] = None
    ) -> UserList:
        """Get users with pagination and filtering"""
        query = db.query(User).filter(User.is_deleted == False)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        total = query.count()
        
        offset = (page - 1) * size
        users = query.offset(offset).limit(size).all()
        
        pages = math.ceil(total / size) if total > 0 else 1
        
        return UserList(
            users=[UserResponse.from_orm(user) for user in users],
            total=total,
            page=page,
            size=size,
            pages=pages
        )
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate) -> UserResponse:
        """Update user by ID"""
        user = db.query(User).filter(
            User.id == user_id, 
            User.is_deleted == False
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        return UserResponse.from_orm(user)
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """Soft delete user by ID"""
        user = db.query(User).filter(
            User.id == user_id, 
            User.is_deleted == False
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.is_deleted = True
        user.is_active = False
        
        db.commit()
        return True
    
    @staticmethod
    def get_current_user_profile(db: Session, current_user: User) -> UserResponse:
        """Get current user profile"""
        return UserResponse.from_orm(current_user)
