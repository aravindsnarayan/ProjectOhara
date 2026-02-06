"""
Camoufox Web Scraper
====================
Zero-detection web scraping with Camoufox Firefox fork.

Enhanced with:
- Response length limits (memory protection)
- Content type validation (text/html only)
- Retry logic with exponential backoff
- Domain extraction helper
- Improved timeout handling
"""

import asyncio
import os
import re
import time
import random
from typing import Optional, Tuple, Union, Literal
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

# Security limits
MAX_URLS_PER_BATCH = 100
MAX_RESPONSE_SIZE = 10_000_000  # 10MB
MAX_CHARS_PER_PAGE = 50_000  # Per-page truncation for LLM processing
MIN_RATE_LIMIT_DELAY = 0.5

# Retry configuration
MAX_RETRIES = 3
INITIAL_BACKOFF = 1.0  # seconds
MAX_BACKOFF = 30.0  # seconds
BACKOFF_MULTIPLIER = 2.0

# Allowed content types
ALLOWED_CONTENT_TYPES = frozenset([
    "text/html",
    "text/plain",
    "application/xhtml+xml",
    "application/xml",
    "text/xml",
])

# Headless mode: 'virtual' uses Xvfb (required in Docker), True uses native headless
# Set USE_VIRTUAL_DISPLAY=true in Docker environment
def get_headless_mode() -> Union[bool, Literal['virtual']]:
    """Get headless mode based on environment."""
    if os.getenv("USE_VIRTUAL_DISPLAY", "").lower() in ("true", "1", "yes"):
        return 'virtual'
    return True


def extract_domain(url: str) -> str:
    """
    Extract domain from URL.
    
    Args:
        url: Full URL string
    
    Returns:
        Domain string (e.g., 'example.com')
    """
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path.split('/')[0]
        # Remove port if present
        domain = domain.split(':')[0]
        # Remove www. prefix for normalization
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain.lower()
    except Exception:
        return ""


def is_valid_content_type(content_type: Optional[str]) -> bool:
    """
    Check if content type is allowed (text/html, not binaries).
    
    Args:
        content_type: Content-Type header value
    
    Returns:
        True if content is scrapable text
    """
    if not content_type:
        # Allow if no content-type (will validate content later)
        return True
    
    # Extract base content type (remove charset, boundary, etc.)
    base_type = content_type.split(';')[0].strip().lower()
    return base_type in ALLOWED_CONTENT_TYPES


def calculate_backoff(attempt: int) -> float:
    """
    Calculate exponential backoff delay with jitter.
    
    Args:
        attempt: Current retry attempt (0-indexed)
    
    Returns:
        Delay in seconds
    """
    delay = min(INITIAL_BACKOFF * (BACKOFF_MULTIPLIER ** attempt), MAX_BACKOFF)
    # Add jitter (±25%)
    jitter = delay * 0.25 * (2 * random.random() - 1)
    return max(0.1, delay + jitter)


def truncate_content(content: str, max_chars: int = MAX_CHARS_PER_PAGE) -> str:
    """
    Truncate content to prevent memory issues.
    
    Args:
        content: Raw content string
        max_chars: Maximum characters to keep
    
    Returns:
        Truncated content with indicator if cut
    """
    if not content or len(content) <= max_chars:
        return content
    return content[:max_chars] + "\n[... truncated ...]" 


def validate_url(url: str) -> bool:
    """Validate URL for SSRF protection."""
    if not url or not isinstance(url, str):
        return False
    
    # Must be http(s)
    if not url.startswith(("http://", "https://")):
        return False
    
    # Block private IPs
    private_patterns = [
        r"^https?://localhost",
        r"^https?://127\.",
        r"^https?://10\.",
        r"^https?://172\.(1[6-9]|2[0-9]|3[0-1])\.",
        r"^https?://192\.168\.",
        r"^https?://\[::1\]",
        r"^https?://0\.0\.0\.0",
    ]
    
    for pattern in private_patterns:
        if re.match(pattern, url, re.IGNORECASE):
            return False
    
    return True


def validate_urls(urls: list[str]) -> list[str]:
    """Filter URLs for safety."""
    return [url for url in urls if validate_url(url)]


class CamoufoxScraper:
    """
    Zero-detection web scraper using Camoufox (Firefox fork).
    
    Bypasses Cloudflare, DataDome, PerimeterX, etc.
    """
    
    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self._camoufox = None
        self.wait_after_load = 2.0
        self.max_body_wait = 5.0
    
    def _ensure_camoufox(self) -> bool:
        """Lazy load camoufox."""
        if self._camoufox is not None:
            return True
        
        try:
            from camoufox.async_api import AsyncCamoufox
            self._camoufox = AsyncCamoufox
            return True
        except ImportError:
            logger.error("camoufox not installed: pip install camoufox[geoip]")
            return False
    
    def is_available(self) -> bool:
        """Check if camoufox is installed."""
        try:
            from camoufox.async_api import AsyncCamoufox
            return True
        except ImportError:
            return False
    
    async def scrape_async(
        self, 
        url: str, 
        retries: int = MAX_RETRIES,
        validate_content_type: bool = True
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Scrape a URL asynchronously with retry logic.
        
        Args:
            url: URL to scrape
            retries: Number of retry attempts
            validate_content_type: Check content-type header
        
        Returns:
            Tuple (html, error_message)
        """
        if not validate_url(url):
            return (None, f"URL blocked for security: {url[:50]}...")
        
        if not self._ensure_camoufox():
            return (None, "camoufox not installed")
        
        last_error = None
        
        for attempt in range(retries + 1):
            try:
                # Use 'virtual' for Xvfb in Docker, True for native headless
                async with self._camoufox(headless=get_headless_mode()) as browser:
                    page = await browser.new_page()
                    
                    response = await page.goto(
                        url,
                        wait_until="domcontentloaded",
                        timeout=self.timeout * 1000,
                    )
                    
                    # Content type validation
                    if validate_content_type and response:
                        content_type = response.headers.get('content-type', '')
                        if not is_valid_content_type(content_type):
                            return (None, f"Blocked content-type: {content_type[:50]}")
                    
                    await asyncio.sleep(self.wait_after_load)
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                    await asyncio.sleep(0.5)
                    
                    html = await page.content()
                    
                    # Apply response size limit
                    if html and len(html) > MAX_RESPONSE_SIZE:
                        html = html[:MAX_RESPONSE_SIZE] + "\n<!-- TRUNCATED -->"
                        logger.warning(f"Response truncated for {url[:50]}")
                    
                    return (html, None)
            
            except asyncio.TimeoutError:
                last_error = f"Timeout after {self.timeout}s"
                if attempt < retries:
                    backoff = calculate_backoff(attempt)
                    logger.info(f"Retry {attempt + 1}/{retries} for {url[:50]} after {backoff:.1f}s")
                    await asyncio.sleep(backoff)
                    continue
            except Exception as e:
                last_error = str(e)
                # Don't retry on certain errors
                if "net::ERR_NAME_NOT_RESOLVED" in last_error:
                    break
                if attempt < retries:
                    backoff = calculate_backoff(attempt)
                    logger.info(f"Retry {attempt + 1}/{retries} for {url[:50]} after {backoff:.1f}s")
                    await asyncio.sleep(backoff)
                    continue
        
        return (None, last_error)
    
    async def scrape_text_async(self, url: str) -> Optional[str]:
        """Get visible text from a URL."""
        if not validate_url(url):
            return None
        
        if not self._ensure_camoufox():
            return None
        
        try:
            async with self._camoufox(headless=get_headless_mode()) as browser:
                page = await browser.new_page()
                await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=self.timeout * 1000,
                )
                
                waited = 0
                while waited < self.max_body_wait:
                    has_body = await page.evaluate("document.body !== null")
                    if has_body:
                        break
                    await asyncio.sleep(0.5)
                    waited += 0.5
                
                await asyncio.sleep(self.wait_after_load)
                
                try:
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                except:
                    pass
                
                await asyncio.sleep(1.0)
                return await page.evaluate("document.body?.innerText || ''")
        
        except Exception as e:
            logger.error(f"Scrape failed: {e}")
            return None


async def scrape_urls_batch(
    urls: list[str],
    timeout: int = 15,
    max_concurrent: int = 5,
    retries_per_url: int = 2,
    validate_content_type: bool = True,
) -> dict[str, str]:
    """
    Scrape multiple URLs sequentially with retry logic and content validation.
    
    Args:
        urls: List of URLs to scrape (max 100)
        timeout: Timeout per URL in seconds
        max_concurrent: Ignored (sequential for stability)
        retries_per_url: Number of retries per URL
        validate_content_type: Skip non-text content types
    
    Returns:
        Dict {url: content} for successful scrapes
    """
    if not urls:
        return {}
    
    # Security limits
    if len(urls) > MAX_URLS_PER_BATCH:
        logger.warning(f"URL list truncated: {len(urls)} -> {MAX_URLS_PER_BATCH}")
        urls = urls[:MAX_URLS_PER_BATCH]
    
    safe_urls = validate_urls(urls)
    blocked_count = len(urls) - len(safe_urls)
    if blocked_count > 0:
        logger.warning(f"Blocked {blocked_count} unsafe URLs")
    
    if not safe_urls:
        return {}
    
    try:
        from camoufox.async_api import AsyncCamoufox
    except ImportError:
        logger.error("camoufox not installed")
        return {}
    
    results = {}
    total = len(safe_urls)
    browser = None
    
    try:
        browser = await AsyncCamoufox(headless=get_headless_mode()).start()
        logger.info(f"Scraping {total} URLs...")
        
        page = await browser.new_page()
        last_request_time = 0.0
        
        for i, url in enumerate(safe_urls, 1):
            elapsed = time.time() - last_request_time
            if elapsed < MIN_RATE_LIMIT_DELAY:
                await asyncio.sleep(MIN_RATE_LIMIT_DELAY - elapsed)
            
            last_request_time = time.time()
            start = time.time()
            last_error = None
            
            # Retry loop for each URL
            for attempt in range(retries_per_url + 1):
                try:
                    response = await page.goto(
                        url,
                        wait_until="domcontentloaded",
                        timeout=timeout * 1000,
                    )
                    
                    # Content type validation
                    if validate_content_type and response:
                        content_type = response.headers.get('content-type', '')
                        if not is_valid_content_type(content_type):
                            logger.warning(f"[{i}/{total}] SKIPPED: non-text content ({content_type[:30]})")
                            break
                    
                    await asyncio.sleep(1.0)
                    text = await page.evaluate("document.body?.innerText || ''")
                    
                    if text and len(text.strip()) > 50:
                        # Apply response size limit
                        if len(text) > MAX_RESPONSE_SIZE:
                            text = text[:MAX_RESPONSE_SIZE] + "\n[...TRUNCATED...]"
                        results[url] = text
                        logger.info(f"[{i}/{total}] OK: {len(text)} chars in {time.time() - start:.1f}s")
                        break
                    else:
                        last_error = "Empty content"
                        if attempt < retries_per_url:
                            backoff = calculate_backoff(attempt)
                            logger.debug(f"Retry {attempt + 1} for empty content: {url[:50]}")
                            await asyncio.sleep(backoff)
                            continue
                        logger.warning(f"[{i}/{total}] EMPTY")
                
                except asyncio.TimeoutError:
                    last_error = "Timeout"
                    if attempt < retries_per_url:
                        backoff = calculate_backoff(attempt)
                        logger.debug(f"Retry {attempt + 1} after timeout: {url[:50]}")
                        await asyncio.sleep(backoff)
                        continue
                    logger.warning(f"[{i}/{total}] TIMEOUT after {retries_per_url + 1} attempts")
                
                except Exception as e:
                    last_error = str(e)
                    # Don't retry DNS errors
                    if "ERR_NAME_NOT_RESOLVED" in last_error:
                        logger.warning(f"[{i}/{total}] DNS FAILED: {url[:50]}")
                        break
                    if attempt < retries_per_url:
                        backoff = calculate_backoff(attempt)
                        logger.debug(f"Retry {attempt + 1} after error: {str(e)[:30]}")
                        await asyncio.sleep(backoff)
                        continue
                    logger.warning(f"[{i}/{total}] FAILED: {str(e)[:50]}")
    
    except Exception as e:
        logger.error(f"Scrape batch failed: {e}")
    
    finally:
        if browser:
            try:
                await asyncio.wait_for(browser.close(), timeout=10.0)
            except:
                pass
    
    return results


def format_scraped_for_llm(
    scraped_results: dict[str, str],
    max_chars_per_page: int = MAX_CHARS_PER_PAGE
) -> str:
    """
    Format scrape results for LLM analysis.
    
    Args:
        scraped_results: Dict {url: content} from scrape_urls_batch
        max_chars_per_page: Max characters per page (truncation)
    
    Returns:
        Formatted string for LLM consumption
    """
    if not scraped_results:
        return "No pages were successfully scraped."
    
    lines = []
    
    for i, (url, content) in enumerate(scraped_results.items(), 1):
        domain = extract_domain(url)
        lines.append(f"=== PAGE {i}: {url} (domain: {domain}) ===")
        
        if content:
            truncated = truncate_content(content, max_chars_per_page)
            lines.append(truncated)
        else:
            lines.append("[No content]")
        
        lines.append("")
    
    formatted = "\n".join(lines)
    logger.info(f"Formatted {len(scraped_results)} pages: {len(formatted)} chars total")
    return formatted
