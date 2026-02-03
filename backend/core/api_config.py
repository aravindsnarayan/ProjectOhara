"""
API Config - Runtime Key Storage
================================
Manages API configuration for LLM providers.
"""

from typing import Optional

_CURRENT_API_KEY: str = ""
_CURRENT_PROVIDER: str = "openrouter"
_CURRENT_BASE_URL: str = "https://openrouter.ai/api/v1/chat/completions"
_CURRENT_WORK_MODEL: str = "google/gemini-2.5-flash-lite-preview-09-2025"
_CURRENT_FINAL_MODEL: str = "anthropic/claude-sonnet-4.5"

PROVIDER_CONFIG = {
    "openrouter": {
        "name": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1/chat/completions",
    },
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1/chat/completions",
    },
    "anthropic": {
        "name": "Anthropic",
        "base_url": "https://api.anthropic.com/v1/messages",
    },
    "google": {
        "name": "Google Gemini",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    },
    "huggingface": {
        "name": "HuggingFace",
        "base_url": "https://api-inference.huggingface.co/v1/chat/completions",
    },
}


def set_api_config(
    key: str,
    provider: str = "openrouter",
    work_model: Optional[str] = None,
    final_model: Optional[str] = None,
    base_url: Optional[str] = None,
) -> None:
    """Set API configuration."""
    global _CURRENT_API_KEY, _CURRENT_PROVIDER, _CURRENT_BASE_URL, _CURRENT_WORK_MODEL, _CURRENT_FINAL_MODEL
    
    _CURRENT_API_KEY = key or ""
    _CURRENT_PROVIDER = provider or "openrouter"
    
    config = PROVIDER_CONFIG.get(_CURRENT_PROVIDER)
    if base_url:
        _CURRENT_BASE_URL = base_url
    elif config:
        _CURRENT_BASE_URL = config["base_url"]
    
    if work_model:
        _CURRENT_WORK_MODEL = work_model
    if final_model:
        _CURRENT_FINAL_MODEL = final_model


def get_api_key() -> str:
    return _CURRENT_API_KEY


def get_provider() -> str:
    return _CURRENT_PROVIDER


def get_api_base_url() -> str:
    return _CURRENT_BASE_URL


def get_work_model() -> str:
    return _CURRENT_WORK_MODEL


def get_final_model() -> str:
    return _CURRENT_FINAL_MODEL


def get_api_headers() -> dict:
    """Get headers for API calls based on provider."""
    headers = {"Content-Type": "application/json"}
    
    if _CURRENT_API_KEY:
        headers["Authorization"] = f"Bearer {_CURRENT_API_KEY}"
    
    if _CURRENT_PROVIDER == "google" and _CURRENT_API_KEY:
        headers["x-goog-api-key"] = _CURRENT_API_KEY
    
    if _CURRENT_PROVIDER == "anthropic" and _CURRENT_API_KEY:
        headers["x-api-key"] = _CURRENT_API_KEY
        headers["anthropic-version"] = "2023-06-01"
    
    return headers
