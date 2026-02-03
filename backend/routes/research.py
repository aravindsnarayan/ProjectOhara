"""
Research Routes
===============
API endpoints for the research pipeline.
"""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from auth import get_current_user
from models import User, ResearchSession
from services.research import ResearchPipeline, ResearchEvent

router = APIRouter(prefix="/research", tags=["Research"])


# === Request/Response Models ===

class OverviewRequest(BaseModel):
    """Request to start research overview."""
    message: str = Field(..., max_length=10000)
    provider: str = Field("openrouter")
    work_model: str = Field("google/gemini-2.5-flash-lite-preview-09-2025")
    language: str = Field("en")


class OverviewResponse(BaseModel):
    """Response from overview endpoint."""
    session_id: str
    session_title: str
    queries: list[str]
    error: Optional[str] = None


class SearchRequest(BaseModel):
    """Request to search and pick URLs."""
    session_id: str
    queries: list[str]


class SearchResponse(BaseModel):
    """Response with picked URLs."""
    urls: list[str]
    error: Optional[str] = None


class ClarifyRequest(BaseModel):
    """Request for clarification."""
    session_id: str
    urls: list[str]


class ClarifyResponse(BaseModel):
    """Response with clarification questions."""
    clarification: str
    scraped_count: int
    error: Optional[str] = None


class PlanRequest(BaseModel):
    """Request to create research plan."""
    session_id: str
    clarification_answers: list[str] = Field(default_factory=list)
    academic_mode: bool = False


class PlanResponse(BaseModel):
    """Response with research plan."""
    plan_points: list[str]
    plan_text: str
    error: Optional[str] = None


class DeepResearchRequest(BaseModel):
    """Request for deep research."""
    session_id: str
    plan_points: list[str]
    provider: str = Field("openrouter")
    work_model: str = Field("google/gemini-2.5-flash-lite-preview-09-2025")
    final_model: str = Field("anthropic/claude-sonnet-4.5")
    language: str = Field("en")


# === Helper Functions ===

def get_api_key(user: User, provider: str) -> str:
    """Get API key for provider from user settings."""
    if not user.api_keys:
        raise HTTPException(
            status_code=400,
            detail=f"No API key configured for {provider}. Please add one in settings."
        )
    
    key = user.api_keys.get(provider)
    if not key:
        raise HTTPException(
            status_code=400,
            detail=f"No API key configured for {provider}. Please add one in settings."
        )
    
    return key


async def get_or_create_session(
    db: AsyncSession,
    user: User,
    session_id: Optional[str] = None,
    title: str = "New Research",
) -> ResearchSession:
    """Get existing session or create new one."""
    if session_id:
        result = await db.execute(
            select(ResearchSession).where(
                ResearchSession.id == session_id,
                ResearchSession.user_id == user.id,
            )
        )
        session = result.scalar_one_or_none()
        if session:
            return session
    
    # Create new session
    session = ResearchSession(
        user_id=user.id,
        title=title,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


# === Endpoints ===

@router.post("/overview", response_model=OverviewResponse)
async def research_overview(
    request: OverviewRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Step 1: Generate overview and search queries."""
    
    api_key = get_api_key(user, request.provider)
    
    pipeline = ResearchPipeline(
        api_key=api_key,
        provider=request.provider,
        work_model=request.work_model,
        language=request.language,
    )
    
    result = await pipeline.get_overview(request.message)
    
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])
    
    # Create session
    session = await get_or_create_session(
        db, user, title=result.get("session_title", "New Research")
    )
    
    # Update session
    session.context_state = {
        "user_query": request.message,
        "queries": result.get("queries", []),
    }
    session.messages = [
        {"role": "user", "content": request.message},
    ]
    await db.commit()
    
    return OverviewResponse(
        session_id=session.id,
        session_title=result.get("session_title", "New Research"),
        queries=result.get("queries", []),
    )


@router.post("/search", response_model=SearchResponse)
async def research_search(
    request: SearchRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Step 2: Execute searches and pick URLs."""
    
    # Get session
    result = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == request.session_id,
            ResearchSession.user_id == user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get provider from user preferences
    prefs = user.preferences or {}
    provider = prefs.get("provider", "openrouter")
    api_key = get_api_key(user, provider)
    
    pipeline = ResearchPipeline(api_key=api_key, provider=provider)
    
    user_query = session.context_state.get("user_query", "")
    result = await pipeline.search_and_pick(user_query, request.queries)
    
    if result.get("error"):
        return SearchResponse(urls=[], error=result["error"])
    
    # Update session
    ctx = session.context_state or {}
    ctx["urls"] = result.get("urls", [])
    session.context_state = ctx
    await db.commit()
    
    return SearchResponse(urls=result.get("urls", []))


@router.post("/clarify", response_model=ClarifyResponse)
async def research_clarify(
    request: ClarifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Step 3: Scrape URLs and generate clarification questions."""
    
    result_query = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == request.session_id,
            ResearchSession.user_id == user.id,
        )
    )
    session = result_query.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    prefs = user.preferences or {}
    provider = prefs.get("provider", "openrouter")
    api_key = get_api_key(user, provider)
    
    pipeline = ResearchPipeline(api_key=api_key, provider=provider)
    
    user_query = session.context_state.get("user_query", "")
    result = await pipeline.clarify(user_query, request.urls)
    
    if result.get("error"):
        return ClarifyResponse(clarification="", scraped_count=0, error=result["error"])
    
    # Update session
    ctx = session.context_state or {}
    ctx["clarification"] = result.get("clarification", "")
    session.context_state = ctx
    session.phase = "clarifying"
    
    # Add message
    messages = session.messages or []
    messages.append({
        "role": "assistant",
        "content": result.get("clarification", ""),
    })
    session.messages = messages
    
    await db.commit()
    
    return ClarifyResponse(
        clarification=result.get("clarification", ""),
        scraped_count=result.get("scraped_count", 0),
    )


@router.post("/plan", response_model=PlanResponse)
async def research_plan(
    request: PlanRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Step 4: Create research plan."""
    
    result_query = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == request.session_id,
            ResearchSession.user_id == user.id,
        )
    )
    session = result_query.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    prefs = user.preferences or {}
    provider = prefs.get("provider", "openrouter")
    api_key = get_api_key(user, provider)
    
    pipeline = ResearchPipeline(api_key=api_key, provider=provider)
    
    user_query = session.context_state.get("user_query", "")
    result = await pipeline.create_plan(
        user_query,
        request.clarification_answers,
        request.academic_mode,
    )
    
    if not result.get("plan_points"):
        return PlanResponse(plan_points=[], plan_text="", error="Failed to create plan")
    
    # Update session
    ctx = session.context_state or {}
    ctx["research_plan"] = result["plan_points"]
    ctx["clarification_answers"] = request.clarification_answers
    session.context_state = ctx
    session.phase = "planning"
    session.academic_mode = request.academic_mode
    
    # Add messages
    messages = session.messages or []
    if request.clarification_answers:
        messages.append({
            "role": "user",
            "content": "\n".join(request.clarification_answers),
        })
    messages.append({
        "role": "assistant",
        "content": result.get("plan_text", ""),
        "type": "plan",
    })
    session.messages = messages
    
    await db.commit()
    
    return PlanResponse(
        plan_points=result["plan_points"],
        plan_text=result.get("plan_text", ""),
    )


@router.post("/deep")
async def research_deep(
    request: DeepResearchRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Step 5: Execute deep research - STREAMING.
    
    Returns NDJSON stream with research events.
    """
    
    result_query = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == request.session_id,
            ResearchSession.user_id == user.id,
        )
    )
    session = result_query.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    api_key = get_api_key(user, request.provider)
    
    pipeline = ResearchPipeline(
        api_key=api_key,
        provider=request.provider,
        work_model=request.work_model,
        final_model=request.final_model,
        language=request.language,
    )
    
    user_query = session.context_state.get("user_query", "")
    
    async def generate():
        """Stream research events as NDJSON."""
        try:
            # Update session phase
            session.phase = "researching"
            await db.commit()
            
            async for event in pipeline.deep_research(user_query, request.plan_points):
                yield json.dumps({
                    "type": event.type,
                    "message": event.message,
                    "data": event.data,
                }) + "\n"
                
                # Update session on completion
                if event.type == "done" and event.data:
                    session.phase = "done"
                    session.final_document = event.data.get("final_document")
                    session.source_registry = event.data.get("source_registry", {})
                    session.total_sources = event.data.get("total_sources", 0)
                    session.duration_seconds = int(event.data.get("duration_seconds", 0))
                    await db.commit()
        
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "message": str(e),
            }) + "\n"
    
    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
    )


# === Session Management ===

@router.get("/sessions")
async def list_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's research sessions."""
    
    result = await db.execute(
        select(ResearchSession)
        .where(ResearchSession.user_id == user.id)
        .order_by(ResearchSession.updated_at.desc())
    )
    sessions = result.scalars().all()
    
    return {
        "sessions": [
            {
                "id": s.id,
                "title": s.title,
                "phase": s.phase,
                "academic_mode": s.academic_mode,
                "total_sources": s.total_sources,
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat(),
            }
            for s in sessions
        ]
    }


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific research session."""
    
    result = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == session_id,
            ResearchSession.user_id == user.id,
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "id": session.id,
        "title": session.title,
        "phase": session.phase,
        "academic_mode": session.academic_mode,
        "context_state": session.context_state,
        "messages": session.messages,
        "final_document": session.final_document,
        "source_registry": session.source_registry,
        "total_sources": session.total_sources,
        "duration_seconds": session.duration_seconds,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
    }


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a research session."""
    
    result = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == session_id,
            ResearchSession.user_id == user.id,
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await db.delete(session)
    await db.commit()
    
    return {"message": "Session deleted"}


@router.patch("/sessions/{session_id}")
async def update_session(
    session_id: str,
    updates: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update session (title, etc.)."""
    
    result = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == session_id,
            ResearchSession.user_id == user.id,
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if "title" in updates:
        session.title = updates["title"]
    
    await db.commit()
    
    return {"message": "Session updated"}
