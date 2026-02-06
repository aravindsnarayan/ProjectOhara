"""
Camoufox Web Scraper
====================
Zero-detection web scraping with Camoufox Firefox fork.
"""

import asyncio
import os
import re
import time
from typing import Optional, Tuple, Union, Literal
import logging

logger = logging.getLogger(__name__)

# Security limits
MAX_URLS_PER_BATCH = 100
MAX_RESPONSE_SIZE = 10_000_000  # 10MB
MIN_RATE_LIMIT_DELAY = 0.5

# Headless mode: 'virtual' uses Xvfb (required in Docker), True uses native headless
# Set USE_VIRTUAL_DISPLAY=true in Docker environment
def get_headless_mode() -> Union[bool, Literal['virtual']]:
    """Get headless mode based on environment."""
    if os.getenv("USE_VIRTUAL_DISPLAY", "").lower() in ("true", "1", "yes"):
        return 'virtual'
    return True


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
    
    async def scrape_async(self, url: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Scrape a URL asynchronously.
        
        Returns:
            Tuple (html, error_message)
        """
        if not validate_url(url):
            return (None, f"URL blocked for security: {url[:50]}...")
        
        if not self._ensure_camoufox():
            return (None, "camoufox not installed")
        
        try:
            # Use 'virtual' for Xvfb in Docker, True for native headless
            async with self._camoufox(headless=get_headless_mode()) as browser:
                page = await browser.new_page()
                
                await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=self.timeout * 1000,
                )
                
                await asyncio.sleep(self.wait_after_load)
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                await asyncio.sleep(0.5)
                
                html = await page.content()
                return (html, None)
        
        except asyncio.TimeoutError:
            return (None, f"Timeout after {self.timeout}s")
        except Exception as e:
            return (None, str(e))
    
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
) -> dict[str, str]:
    """
    Scrape multiple URLs sequentially with short timeouts.
    
    Args:
        urls: List of URLs to scrape (max 100)
        timeout: Timeout per URL in seconds
        max_concurrent: Ignored (sequential for stability)
    
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
            
            try:
                await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=timeout * 1000,
                )
                
                await asyncio.sleep(1.0)
                text = await page.evaluate("document.body?.innerText || ''")
                
                if text and len(text.strip()) > 50:
                    if len(text) > MAX_RESPONSE_SIZE:
                        text = text[:MAX_RESPONSE_SIZE] + "\n[...TRUNCATED...]"
                    results[url] = text
                    logger.info(f"[{i}/{total}] OK: {len(text)} chars in {time.time() - start:.1f}s")
                else:
                    logger.warning(f"[{i}/{total}] EMPTY")
            
            except Exception as e:
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
