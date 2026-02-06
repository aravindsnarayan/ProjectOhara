"""
Security Utilities
==================
Central security functions for the project.

Contains:
- URL Validation (SSRF Protection)
- Input Sanitization
- Domain Validation
"""

import re
import ipaddress
from urllib.parse import urlparse
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# URL VALIDATION (SSRF PROTECTION)
# ============================================================================

# Blocked URL schemes
BLOCKED_SCHEMES = frozenset(['file', 'ftp', 'gopher', 'data', 'javascript'])

# Blocked ports (common internal services)
BLOCKED_PORTS = frozenset([22, 23, 25, 3306, 5432, 6379, 27017, 11211])

# Private/internal hostname patterns
PRIVATE_HOSTNAMES = frozenset([
    'localhost',
    'localhost.localdomain',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '[::1]',
])

# Maximum lengths
MAX_USER_QUERY_LENGTH = 10_000
MAX_SEARCH_QUERY_LENGTH = 500
MAX_URL_LENGTH = 2048


def validate_url(url: str, allow_private: bool = False) -> bool:
    """
    Validates URL against SSRF attacks.

    Blocks:
    - Non-HTTP(S) schemes (file://, javascript://, data://, etc.)
    - Private/internal IPs (127.x, 10.x, 192.168.x, etc.)
    - Localhost and internal hostnames
    - Cloud metadata IPs (169.254.x.x)
    - Dangerous ports

    Args:
        url: URL to validate
        allow_private: If True, allows private IPs (for local dev only)

    Returns:
        True if URL is safe, False otherwise
    """
    if not url or not isinstance(url, str):
        return False

    # Max URL length
    if len(url) > MAX_URL_LENGTH:
        return False

    try:
        parsed = urlparse(url)

        # Must have scheme
        if not parsed.scheme:
            return False

        # Only allow http/https
        if parsed.scheme.lower() not in ('http', 'https'):
            return False

        # Must have host
        hostname = parsed.hostname
        if not hostname:
            return False

        hostname_lower = hostname.lower()

        # Block known private hostnames
        if hostname_lower in PRIVATE_HOSTNAMES:
            if not allow_private:
                return False

        # Block internal TLDs
        if hostname_lower.endswith(('.local', '.internal', '.lan', '.localhost')):
            if not allow_private:
                return False

        # Check port
        port = parsed.port
        if port and port in BLOCKED_PORTS:
            return False

        # IP-based checks
        try:
            ip = ipaddress.ip_address(hostname)

            if not allow_private:
                # Block private IPs
                if ip.is_private:
                    return False

                # Block loopback
                if ip.is_loopback:
                    return False

                # Block link-local (169.254.x.x - AWS/GCP metadata)
                if ip.is_link_local:
                    return False

                # Block reserved
                if ip.is_reserved:
                    return False

                # Block multicast
                if ip.is_multicast:
                    return False

        except ValueError:
            # Not an IP address - it's a domain, which is fine
            pass

        return True

    except Exception as e:
        logger.warning(f"URL validation error: {e}")
        return False


def validate_urls(urls: list[str], allow_private: bool = False) -> list[str]:
    """
    Validates a list of URLs, returning only safe ones.

    Args:
        urls: List of URLs to validate
        allow_private: If True, allows private IPs

    Returns:
        List of safe URLs
    """
    if not urls:
        return []

    return [url for url in urls if validate_url(url, allow_private)]


# ============================================================================
# INPUT SANITIZATION
# ============================================================================

# Dangerous patterns that might indicate prompt injection
PROMPT_INJECTION_PATTERNS = [
    r'ignore\s+(all\s+)?previous\s+instructions?',
    r'system\s*:\s*you\s+are',
    r'<\s*\|\s*system\s*\|>',
    r'###\s*instruction',
    r'new\s+task\s*:',
    r'forget\s+everything',
    r'disregard\s+(all\s+)?previous',
]


def sanitize_user_input(
    text: str,
    max_length: int = MAX_USER_QUERY_LENGTH,
    remove_prompt_markers: bool = True
) -> str:
    """
    Sanitizes user input for safe use in LLM prompts.

    Args:
        text: Raw user input
        max_length: Maximum allowed length
        remove_prompt_markers: If True, escapes format markers

    Returns:
        Sanitized text
    """
    if not text or not isinstance(text, str):
        return ""

    # Length limit
    if len(text) > max_length:
        text = text[:max_length] + "\n[...TRUNCATED...]"

    # Remove control characters (except newlines and tabs)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)

    if remove_prompt_markers:
        # Escape format markers that could break parsing
        markers = [
            '=== SOURCES ===',
            '=== END SOURCES ===',
            '=== SELECTED ===',
            '=== REJECTED ===',
            '=== THINKING ===',
            '=== SEARCHES ===',
            '=== END DOSSIER ===',
            '=== END REPORT ===',
        ]
        for marker in markers:
            text = text.replace(marker, f'[{marker}]')

    return text.strip()


def detect_prompt_injection(text: str) -> bool:
    """
    Detects potential prompt injection attempts.

    Args:
        text: Text to check

    Returns:
        True if suspicious patterns found
    """
    if not text:
        return False

    text_lower = text.lower()

    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            logger.warning(f"Potential prompt injection detected: {pattern}")
            return True

    return False


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'validate_url',
    'validate_urls',
    'sanitize_user_input',
    'detect_prompt_injection',
    'MAX_USER_QUERY_LENGTH',
    'MAX_SEARCH_QUERY_LENGTH',
    'MAX_URL_LENGTH',
]
