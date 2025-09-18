from fastapi import APIRouter, Request, Depends, HTTPException, status
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.stt import router as stt_router
from app.api.v1.endpoints.tts import router as tts_router
from app.api.v1.endpoints.coin import router as coin_router
from app.api.v1.endpoints.realtime import router as realtime_router
from app.api.v1.endpoints.realtime.optimized_router import router as optimized_realtime_router
from app.api.v1.endpoints.streaming.router import router as streaming_router
from app.api.v1.endpoints.location.router import router as location_router
from app.services.voice.router import router as voice_router


router = APIRouter()

router.include_router(users_router)
router.include_router(auth_router)
router.include_router(stt_router)
router.include_router(tts_router)
router.include_router(coin_router)
router.include_router(realtime_router)
router.include_router(optimized_realtime_router)
router.include_router(streaming_router)
router.include_router(location_router)
router.include_router(voice_router)

