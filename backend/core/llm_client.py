"""
LLM Client - Chat Completion Helpers
====================================
Multi-provider LLM client with error handling.
"""

from dataclasses import dataclass
from typing import Any, Optional
import requests
import logging

from .api_config import get_api_base_url, get_api_headers, get_provider

logger = logging.getLogger(__name__)


@dataclass
class LLMCallResult:
    """Result of an LLM API call."""
    content: Optional[str]
    error: Optional[str]
    raw: Optional[dict[str, Any]]


def _build_request_body(
    messages: list[dict[str, str]],
    model: str,
    max_tokens: int,
    provider: str,
) -> dict:
    """Build provider-specific request body."""
    
    if provider == "anthropic":
        # Anthropic: System prompt as top-level param
        system_prompt = None
        filtered_messages = []
        
        for msg in messages:
            if msg.get("role") == "system":
                system_prompt = msg.get("content", "")
            else:
                filtered_messages.append(msg)
        
        body = {
            "model": model,
            "messages": filtered_messages,
            "max_tokens": max_tokens,
        }
        
        if system_prompt:
            body["system"] = system_prompt
        
        return body
    
    elif provider == "google":
        return {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.3,
        }
    
    else:
        # OpenAI / OpenRouter / HuggingFace
        return {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.3,
        }


def _parse_response(result: dict, provider: str) -> Optional[str]:
    """Parse provider-specific response format."""
    
    if provider == "anthropic":
        content_blocks = result.get("content", [])
        if content_blocks:
            first_block = content_blocks[0]
            if isinstance(first_block, dict):
                return first_block.get("text")
            return str(first_block)
        return None
    
    else:
        # OpenAI format
        if "choices" not in result:
            return None
        choice = result["choices"][0]
        message = choice.get("message", {})
        return message.get("content")


def call_chat_completion(
    messages: list[dict[str, str]],
    model: str,
    max_tokens: int,
    timeout: int,
    base_url: Optional[str] = None,
) -> LLMCallResult:
    """
    Execute a chat completion call.
    
    Args:
        messages: List of message dicts with role/content
        model: Model identifier
        max_tokens: Maximum response tokens
        timeout: Request timeout in seconds
        base_url: Optional override for API URL
    
    Returns:
        LLMCallResult with content, error, and raw response
    """
    url = base_url or get_api_base_url()
    provider = get_provider()
    
    request_body = _build_request_body(messages, model, max_tokens, provider)
    
    logger.debug(f"[LLM] Provider: {provider}, Model: {model}, max_tokens: {max_tokens}")
    
    try:
        response = requests.post(
            url,
            headers=get_api_headers(),
            json=request_body,
            timeout=timeout,
        )
        
        if not response.ok:
            try:
                payload = response.json()
            except ValueError:
                payload = response.text
            
            if isinstance(payload, dict):
                error = payload.get("error", {})
                if isinstance(error, dict):
                    message = error.get("message") or str(error)
                else:
                    message = str(error)
            else:
                message = str(payload)
            
            error_message = f"HTTP {response.status_code}: {message}"
            logger.error(f"LLM API error: {error_message}")
            return LLMCallResult(content=None, error=error_message, raw=None)
        
        result = response.json()
        content = _parse_response(result, provider)
        
        if content is None or not str(content).strip():
            logger.warning(f"LLM returned empty content")
        
        return LLMCallResult(content=content, error=None, raw=result)
    
    except requests.Timeout:
        return LLMCallResult(content=None, error="LLM timeout", raw=None)
    except Exception as e:
        return LLMCallResult(content=None, error=f"LLM call failed: {e}", raw=None)
