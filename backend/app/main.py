from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends

import asyncio
import logging


from app.core.config import get_settings
from app.core.database import Base, engine

from app.api import api_router

settings = get_settings()


app = FastAPI(
    title=settings.PROJECT_NAME,
    docs_url=None,  # Disable /docs
    redoc_url=None  # Disable /redoc
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)

app.include_router(api_router, prefix="/api/v1")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Service is running"}
