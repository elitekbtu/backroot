from datetime import timedelta
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    authenticate_user, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    decode_refresh_token
)
from app.core.config import get_settings
from app.database.models import User
from .schema import LoginRequest, RegisterRequest, TokenResponse, RefreshTokenRequest

settings = get_settings()


class AuthService:
    @staticmethod
    def login(db: Session, login_data: LoginRequest) -> TokenResponse:
        """Authenticate user and return tokens"""
        user = authenticate_user(db, login_data.username, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        access_token = create_access_token(
            data={"sub": str(user.id)}, 
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}, 
            expires_delta=refresh_token_expires
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    @staticmethod
    def register(db: Session, register_data: RegisterRequest) -> TokenResponse:
        """Register new user and return tokens"""
        existing_user = db.query(User).filter(User.username == register_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        hashed_password = get_password_hash(register_data.password)
        new_user = User(
            username=register_data.username,
            hashed_password=hashed_password,
            first_name=register_data.first_name,
            last_name=register_data.last_name,
            is_active=True,
            is_deleted=False
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        access_token = create_access_token(
            data={"sub": str(new_user.id)}, 
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(
            data={"sub": str(new_user.id)}, 
            expires_delta=refresh_token_expires
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_data: RefreshTokenRequest) -> TokenResponse:
        """Generate new access token using refresh token"""
        try:
            payload = decode_refresh_token(refresh_data.refresh_token)
            user_id = payload.get("sub")
            
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token"
                )
            
            user = db.query(User).filter(User.id == int(user_id)).first()
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive"
                )
            
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            
            access_token = create_access_token(
                data={"sub": str(user.id)}, 
                expires_delta=access_token_expires
            )
            new_refresh_token = create_refresh_token(
                data={"sub": str(user.id)}, 
                expires_delta=refresh_token_expires
            )
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=new_refresh_token,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
