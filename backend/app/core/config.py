# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Backend"
    BACKEND_CORS_ORIGINS: list[str] = ['localhost']
    DATABASE_URL: str = Field(env="DATABASE_URL")

    SECRET_KEY: str = Field("", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(14, env="REFRESH_TOKEN_EXPIRE_DAYS")

    # ✅ New: AI & Speech
    OPENAI_API_KEY: str = Field("", env="OPENAI_API_KEY")
    AZURE_SPEECH_KEY: str = Field("", env="AZURE_SPEECH_KEY")
    AZURE_SPEECH_REGION: str = Field("", env="AZURE_SPEECH_REGION")
    AZURE_SPEECH_LOCALE: str = Field("kk-KZ", env="AZURE_SPEECH_LOCALE")
    AZURE_TTS_VOICE: str = Field("kk-KZ-AigulNeural", env="AZURE_TTS_VOICE")

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()
