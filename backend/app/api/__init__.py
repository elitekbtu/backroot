from .api import router as api_router 
# app/api/__init__.py
from fastapi import APIRouter
from app.services.voice.ws import router as voice_router

api_router = APIRouter()
api_router.include_router(voice_router, tags=["voice"])
