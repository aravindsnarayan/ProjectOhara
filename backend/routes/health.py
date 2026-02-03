"""
Health Check Routes
==================
"""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Project Ohara API",
        "version": "1.0.0",
    }
