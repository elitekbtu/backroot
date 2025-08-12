from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import get_db, get_current_user
from app.database.models import User
from .schema import LoginRequest, RegisterRequest, TokenResponse, RefreshTokenRequest, UserInfo
from .service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    login_data = LoginRequest(username=form_data.username, password=form_data.password)
    return AuthService.login(db, login_data)


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login user and return access and refresh tokens
    """
    return AuthService.login(db, login_data)


@router.post("/register", response_model=TokenResponse)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register new user and return access and refresh tokens
    """
    return AuthService.register(db, register_data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    return AuthService.refresh_access_token(db, refresh_data)


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return UserInfo.from_orm(current_user)


@router.post("/logout")
async def logout():
    """
    Logout user (client should remove tokens)
    """
    return {"message": "Successfully logged out"}
