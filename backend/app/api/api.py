from fastapi import APIRouter, Request, Depends, HTTPException, status
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.stt import router as stt_router
from app.api.v1.endpoints.tts import router as tts_router


router = APIRouter()

router.include_router(users_router)
router.include_router(auth_router)
router.include_router(stt_router)
router.include_router(tts_router)

