# Project Ohara - AI Agent Instructions

## Architecture Overview

Full-stack deep research engine with **React frontend** + **FastAPI backend**. Research flows through a 6-step pipeline: Overview → Search → Clarify → Plan → Deep Research → Synthesis.

### Key Components
- **`backend/services/research.py`** - Core `ResearchPipeline` class orchestrating all research phases
- **`backend/core/`** - LLM client (`llm_client.py`), API config (`api_config.py`), Camoufox scraper (`scraper.py`)
- **`backend/prompts/`** - LLM prompt templates for each pipeline stage (think, pick_urls, clarify, plan, dossier, final_synthesis)
- **`frontend/src/hooks/useResearch.ts`** - Research workflow state machine on client side
- **`frontend/src/stores/`** - Zustand stores: auth.ts, settings.ts, sessions.ts

### Data Flow
1. User query → `POST /api/research/overview` → generates search queries
2. Queries → `POST /api/research/search` → DuckDuckGo search → URL selection via LLM
3. URLs → `POST /api/research/clarify` → Camoufox scrapes → LLM asks clarifying questions
4. Answers → `POST /api/research/plan` → LLM creates research plan (5-10 points)
5. Plan → `POST /api/research/deep` → **NDJSON stream** → per-point: search → scrape → dossier
6. Final → LLM synthesizes all dossiers into report with citations

## Development Commands

```bash
# Backend (from backend/)
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend (from frontend/)
npm run dev                    # Dev server at :5173
npm run build                  # Production build
npx tsc --noEmit              # Type check

# Camoufox browser install (required for scraping)
python -m camoufox fetch
```

## Code Patterns

### Backend: Prompt Templates
Each prompt module exports a function returning `(system_prompt, user_prompt)`:
```python
# backend/prompts/think.py pattern
def get_think_prompt(query: str, context: str) -> tuple[str, str]:
    system = """You generate search queries..."""
    user = f"Research topic: {query}\nContext: {context}"
    return system, user
```

### Backend: LLM Calls
Use `call_chat_completion` from `core/`. Always call `set_api_config()` first:
```python
from core import set_api_config, call_chat_completion
set_api_config(api_key, provider, work_model=model)
result = await call_chat_completion(system_prompt, user_prompt)
```

### Backend: Streaming Responses
Deep research uses NDJSON streaming via `StreamingResponse`:
```python
async def generate():
    async for event in pipeline.deep_research(...):
        yield json.dumps({"type": event.type, "message": event.message}) + "\n"
return StreamingResponse(generate(), media_type="application/x-ndjson")
```

### Frontend: Zustand Stores
All stores use `persist` middleware. Type state explicitly:
```typescript
const useStore = create<StateType>()(
  persist((set) => ({ ... }), { name: 'store-key' })
)
```

### Frontend: API Calls
Use `apiFetch` helper from `hooks/useApi.ts`. Auth token auto-injected:
```typescript
await apiFetch('/research/plan', { method: 'POST', body: JSON.stringify(data) })
```

## Critical Implementation Notes

- **API keys stored in backend** - Frontend syncs to `user.api_keys` via `PATCH /api/auth/me/api-keys`
- **OAuth flow** - Backend returns JWT token via redirect to `frontend/auth/callback?token=...`
- **Session middleware required** - OAuth uses Starlette's `SessionMiddleware` for state
- **Database async** - Uses `aiosqlite` (dev) / `asyncpg` (prod) with SQLAlchemy async
- **Scraper anti-detection** - Camoufox (Firefox fork) with 0% bot detection; never use requests/httpx for scraping

## File Naming Conventions
- Backend routes: `routes/{domain}.py` with `router = APIRouter()`
- Frontend pages: `pages/{Name}.tsx` (PascalCase)
- Frontend components: `components/{Name}.tsx` (PascalCase)
- Prompt modules: `prompts/{action}.py` (snake_case)
