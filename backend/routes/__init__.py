"""Routes package."""

from .auth import router as auth_router
from .research import router as research_router
from .health import router as health_router

__all__ = ["auth_router", "research_router", "health_router"]
