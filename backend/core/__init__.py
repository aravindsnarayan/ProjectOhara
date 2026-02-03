"""
Project Ohara - Core Research Module
====================================
Adapted from Lutum Veritas research engine.
"""

from .api_config import (
    set_api_config,
    get_api_key,
    get_provider,
    get_api_base_url,
    get_api_headers,
    get_work_model,
    get_final_model,
    PROVIDER_CONFIG,
)

from .llm_client import call_chat_completion, LLMCallResult

from .scraper import CamoufoxScraper, scrape_urls_batch

__all__ = [
    "set_api_config",
    "get_api_key",
    "get_provider",
    "get_api_base_url",
    "get_api_headers",
    "get_work_model",
    "get_final_model",
    "PROVIDER_CONFIG",
    "call_chat_completion",
    "LLMCallResult",
    "CamoufoxScraper",
    "scrape_urls_batch",
]
