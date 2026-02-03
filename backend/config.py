"""
Project Ohara - Configuration
=============================
Settings management with Pydantic.
"""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./projectohara.db"
    
    # Security
    secret_key: str = "change-this-to-a-secure-random-string"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Frontend
    frontend_url: str = "http://localhost:5173"
    
    # OAuth - Google
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    
    # OAuth - GitHub
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    
    # LLM Defaults
    default_provider: str = "openrouter"
    default_work_model: str = "google/gemini-2.5-flash-lite-preview-09-2025"
    default_final_model: str = "anthropic/claude-sonnet-4.5"
    
    @property
    def async_database_url(self) -> str:
        """Convert sync URL to async if needed."""
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://")
        if url.startswith("sqlite://"):
            return url.replace("sqlite://", "sqlite+aiosqlite://")
        return url


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
