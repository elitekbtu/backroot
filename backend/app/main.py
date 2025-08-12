from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends

import asyncio
import logging


from core.config import get_settings
from core.database import Base, engine

from api import api_router

settings = get_settings()


app = FastAPI(
    title=settings.PROJECT_NAME
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)

app.include_router(api_router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Service is running"}
