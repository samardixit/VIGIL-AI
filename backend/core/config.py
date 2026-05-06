"""
VIGIL-AI Configuration Module
Loads environment variables using Pydantic BaseSettings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    # Database
    DATABASE_URL: str = "mysql+aiomysql://root:root@localhost:3306/vigil_ai"

    # JWT Authentication
    JWT_SECRET_KEY: str = "vigil-ai-super-secret-key-change-in-production-2024"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 480

    # Google Gemini API
    GEMINI_API_KEY: str = "YOUR_GEMINI_API_KEY_HERE"

    # Geofence
    DEFAULT_GEOFENCE_RADIUS: int = 20
    ATTENDANCE_WINDOW_MINUTES: int = 10

    # Application
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = True

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        env_file_encoding = "utf-8"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — loaded once, reused everywhere."""
    return Settings()
