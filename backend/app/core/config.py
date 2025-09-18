from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, validator
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    PROJECT_NAME: str = "Backend"
    BACKEND_CORS_ORIGINS: list[str] = [
        'localhost:5173', 
        'http://localhost:8081', 
        "http://localhost:19000", 
        "http://localhost:19001",
        "https://46.101.187.24",
        "https://localhost:443",
        "https://localhost:3000",
        "*"
    ]
    DATABASE_URL: str = Field(env="DATABASE_URL")
    SECRET_KEY: str = Field("", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(14, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    OPENAI_API_KEY: str = Field("", env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field("gpt-4o", env="OPENAI_MODEL")
    OPENAI_TTS_MODEL: str = Field("tts-1", env="OPENAI_TTS_MODEL")
    OPENAI_STT_MODEL: str = Field("whisper-1", env="OPENAI_STT_MODEL")
    OPENAI_REALTIME_MODEL: str = Field("gpt-4o-realtime-preview-2024-10-01", env="OPENAI_REALTIME_MODEL")

    # Groq configuration
    GROQ_API_KEY: str = Field("", env="GROQ_API_KEY")
    GROQ_MODEL: str = Field("llama-3.1-70b-versatile", env="GROQ_MODEL")


@lru_cache
def get_settings() -> Settings:
    """Cached settings to avoid re-reading on each access."""
    return Settings()