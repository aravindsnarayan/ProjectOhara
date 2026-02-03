# Project Ohara

> Deep Research Engine - Web Application

A full-featured web application for AI-powered deep research, based on the Lutum Veritas engine. Ohara conducts comprehensive multi-source research with intelligent synthesis, producing detailed reports with proper citations.

## Features

- 🔬 **Deep Research Pipeline** - Multi-step research with recursive learning
- 🎓 **Academic Mode** - Hierarchical research with formal academic structure
- 🔐 **OAuth Authentication** - Sign in with Google or GitHub
- 💾 **Session Management** - Save, resume, and manage research sessions
- 🌐 **Multi-Provider LLM** - OpenRouter, OpenAI, Anthropic, Google, HuggingFace
- 🕵️ **Zero-Detection Scraping** - Camoufox with 0% bot detection rate
- 📊 **Live Progress Updates** - Real-time streaming of research progress
- 🌍 **Multi-Language** - Generates reports in multiple languages

## How It Works

The research pipeline follows these steps:

1. **Overview** - Analyzes your question and generates search queries
2. **Search & Pick** - Executes DuckDuckGo searches and selects best sources
3. **Clarify** - Scrapes sources and asks clarifying questions if needed
4. **Plan** - Creates a structured research plan with 5-10 points
5. **Deep Research** - For each point:
   - Generates targeted search queries
   - Finds and scrapes relevant sources
   - Creates a detailed dossier with citations
6. **Synthesis** - Combines all dossiers into a comprehensive final report

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Zustand |
| Backend | FastAPI, Python 3.11+, SQLAlchemy, Pydantic |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | OAuth2 (Google, GitHub) via Authlib, JWT tokens |
| Scraper | Camoufox (Firefox fork with anti-detection) |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- An API key from OpenRouter, OpenAI, Anthropic, Google, or HuggingFace

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Install Camoufox browser
python -m camoufox fetch

# Configure environment
cp .env.example .env
# Edit .env with your OAuth credentials

# Run the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open http://localhost:5173

### Quick Dev Mode (No OAuth)

For quick local testing without OAuth setup, you can temporarily modify the auth to use a mock user. The app will still require an LLM API key to function.

## Project Structure

```
projectohara/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Pydantic settings
│   ├── database.py          # SQLAlchemy async setup
│   ├── auth/
│   │   └── __init__.py      # OAuth manager, JWT tokens
│   ├── core/
│   │   ├── api_config.py    # LLM API configuration
│   │   ├── llm_client.py    # Multi-provider LLM client
│   │   └── scraper.py       # Camoufox web scraper
│   ├── models/
│   │   └── __init__.py      # User, Session, Dossier models
│   ├── prompts/
│   │   ├── think.py         # Search query generation
│   │   ├── pick_urls.py     # URL selection
│   │   ├── clarify.py       # Clarification questions
│   │   ├── plan.py          # Research planning
│   │   ├── dossier.py       # Dossier creation
│   │   └── final_synthesis.py
│   ├── routes/
│   │   ├── auth.py          # OAuth endpoints
│   │   ├── research.py      # Research pipeline endpoints
│   │   └── health.py        # Health check
│   └── services/
│       └── research.py      # Research pipeline logic
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx         # React entry point
│   │   ├── App.tsx          # Router setup
│   │   ├── components/
│   │   │   ├── Layout.tsx   # App layout with sidebar
│   │   │   ├── Chat.tsx     # Message display
│   │   │   ├── InputBar.tsx # Query input
│   │   │   ├── ProgressPanel.tsx
│   │   │   ├── ClarificationPanel.tsx
│   │   │   └── PlanPanel.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx    # OAuth login
│   │   │   ├── Research.tsx # Main research UI
│   │   │   ├── Sessions.tsx # History
│   │   │   └── Settings.tsx # User settings
│   │   ├── stores/
│   │   │   ├── auth.ts      # Auth state (Zustand)
│   │   │   ├── settings.ts  # User preferences
│   │   │   └── sessions.ts  # Session management
│   │   └── hooks/
│   │       ├── useApi.ts    # API client
│   │       └── useResearch.ts
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── README.md
```

## API Endpoints

### Authentication
- `GET /api/auth/{provider}/login` - Start OAuth flow
- `GET /api/auth/{provider}/callback` - OAuth callback
- `POST /api/auth/logout` - Logout

### Research
- `POST /api/research/overview` - Start research, get queries
- `POST /api/research/search` - Execute searches, pick URLs
- `POST /api/research/clarify` - Scrape and get clarification
- `POST /api/research/plan` - Create research plan
- `POST /api/research/deep` - Stream deep research (NDJSON)

### Sessions
- `GET /api/research/sessions` - List sessions
- `GET /api/research/sessions/{id}` - Get session
- `DELETE /api/research/sessions/{id}` - Delete session

## Environment Variables

### Backend (.env)

```env
# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL=sqlite+aiosqlite:///./ohara.db

# OAuth - Google (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - GitHub (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Security
SECRET_KEY=generate-a-secure-random-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:5173
```

## Setting Up OAuth

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Go to Credentials → Create OAuth Client ID
5. Add redirect URI: `http://localhost:8000/api/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL: `http://localhost:8000/api/auth/github/callback`
4. Copy Client ID and Secret to `.env`

## Recommended Models

### Work Model (Fast, cheap, used for most tasks)
- `google/gemini-2.5-flash-lite-preview-09-2025` (Default)
- `openai/gpt-4o-mini`
- `anthropic/claude-3-5-haiku`

### Final Model (Quality, used for synthesis)
- `anthropic/claude-sonnet-4.5` (Default, recommended)
- `openai/gpt-4o`
- `google/gemini-2.0-pro`

## Development

### Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
# Use gunicorn or uvicorn with multiple workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## License

AGPL-3.0

Based on [Lutum Veritas](https://github.com/your-org/lutum-veritas)
