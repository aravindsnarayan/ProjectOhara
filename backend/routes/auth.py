"""
Project Ohara - Auth Routes
===========================
OAuth login/callback endpoints.
"""

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from config import get_settings
from database import get_db
from auth import oauth, create_access_token, get_or_create_user, get_current_user
from models import User

settings = get_settings()
router = APIRouter(tags=["Authentication"])


@router.get("/providers")
async def get_providers():
    """Get available OAuth providers."""
    providers = []
    if settings.google_client_id:
        providers.append({"id": "google", "name": "Google"})
    if settings.github_client_id:
        providers.append({"id": "github", "name": "GitHub"})
    return {"providers": providers}


# === Google OAuth ===

@router.get("/google/login")
async def google_login(request: Request):
    """Redirect to Google OAuth."""
    if not settings.google_client_id:
        raise HTTPException(status_code=400, detail="Google OAuth not configured")
    
    redirect_uri = f"{request.base_url}api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback."""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user = await get_or_create_user(
            db=db,
            email=user_info["email"],
            name=user_info.get("name", ""),
            avatar_url=user_info.get("picture"),
            provider="google",
            provider_id=user_info["sub"],
        )
        
        access_token = create_access_token(data={"sub": user.id})
        
        # Redirect to frontend with token
        return RedirectResponse(
            url=f"{settings.frontend_url}/auth/callback?token={access_token}"
        )
        
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}/auth/callback?error={str(e)}"
        )


# === GitHub OAuth ===

@router.get("/github/login")
async def github_login(request: Request):
    """Redirect to GitHub OAuth."""
    if not settings.github_client_id:
        raise HTTPException(status_code=400, detail="GitHub OAuth not configured")
    
    redirect_uri = f"{request.base_url}api/auth/github/callback"
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/github/callback")
async def github_callback(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle GitHub OAuth callback."""
    try:
        token = await oauth.github.authorize_access_token(request)
        
        # Get user info from GitHub API
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {token['access_token']}"},
            )
            user_info = resp.json()
            
            # Get primary email
            email_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {token['access_token']}"},
            )
            emails = email_resp.json()
            primary_email = next(
                (e["email"] for e in emails if e.get("primary")),
                user_info.get("email"),
            )
        
        if not primary_email:
            raise HTTPException(status_code=400, detail="Could not get email from GitHub")
        
        user = await get_or_create_user(
            db=db,
            email=primary_email,
            name=user_info.get("name") or user_info.get("login", ""),
            avatar_url=user_info.get("avatar_url"),
            provider="github",
            provider_id=str(user_info["id"]),
        )
        
        access_token = create_access_token(data={"sub": user.id})
        
        return RedirectResponse(
            url=f"{settings.frontend_url}/auth/callback?token={access_token}"
        )
        
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url}/auth/callback?error={str(e)}"
        )


# === User endpoints ===

@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "provider": user.provider,
        "preferences": user.preferences,
        "has_api_keys": bool(user.api_keys),
        "created_at": user.created_at.isoformat(),
    }


@router.patch("/me/api-keys")
async def update_api_keys(
    api_keys: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user's API keys."""
    # Merge with existing keys
    current_keys = user.api_keys or {}
    current_keys.update(api_keys)
    user.api_keys = current_keys
    await db.commit()
    
    return {"message": "API keys updated", "providers": list(current_keys.keys())}


@router.patch("/me/preferences")
async def update_preferences(
    preferences: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user preferences."""
    current_prefs = user.preferences or {}
    current_prefs.update(preferences)
    user.preferences = current_prefs
    await db.commit()
    
    return {"message": "Preferences updated", "preferences": current_prefs}


@router.post("/logout")
async def logout():
    """Logout endpoint (client should clear token)."""
    return {"message": "Logged out successfully"}
