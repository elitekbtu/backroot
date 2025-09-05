from pydantic_settings import BaseSettings
from pydantic import Field, validator
from functools import lru_cache


class Settings(BaseSettings):
    PROJECT_NAME: str = "Backend"
    BACKEND_CORS_ORIGINS: list[str] = ['localhost:5173', 'http://localhost:8081', "http://localhost:19000", "http://localhost:19001", "*"]
    DATABASE_URL: str = Field(env="DATABASE_URL")
    SECRET_KEY: str = Field("", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(14, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    OPENAI_API_KEY: str = Field("", env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field("gpt-4o", env="OPENAI_MODEL")
    OPENAI_TTS_MODEL: str = Field("tts-1", env="OPENAI_TTS_MODEL")
    OPENAI_STT_MODEL: str = Field("whisper-1", env="OPENAI_STT_MODEL")

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    """Cached settings to avoid re-reading on each access."""
    return Settings()