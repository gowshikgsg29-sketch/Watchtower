import asyncio
import re
import time
from typing import Tuple, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; WatchtowerBot/1.0; +https://club.edu/watchtower)"

def normalize_page_text(raw_text: str, filter_timestamps: bool = True) -> str:
    """
    Normalizes webpage text to facilitate meaningful content comparison.
    Reduces noise like dynamic timestamps, rotating tokens, and excessive whitespace.
    Note: Heuristic noise filtering reduces false positives but cannot claim 100% elimination of all dynamic content.
    """
    if not raw_text:
        return ""

    text = raw_text

    if filter_timestamps:
        # Heuristic 1: ISO 8601 timestamps
        text = re.sub(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?", "[TIMESTAMP]", text)
        # Heuristic 2: Relative time statements (e.g. "3 minutes ago", "1 hour ago", "42s ago")
        text = re.sub(r"\b\d+\s*(?:seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?)\s*ago\b", "[RELATIVE_TIME]", text, flags=re.IGNORECASE)
        # Heuristic 3: Clock times (e.g. "12:45:00 PM", "09:30 AM")
        text = re.sub(r"\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b", "[TIME]", text)
        # Heuristic 4: Dynamic copyright notices (e.g. "© 2026", "Copyright 2026")
        text = re.sub(r"(?:©|Copyright(?:\s*\(c\))?)\s*\d{4}", "Copyright [YEAR]", text, flags=re.IGNORECASE)

    # Normalize whitespace: trim lines and collapse consecutive blank lines
    lines = [line.strip() for line in text.splitlines()]
    non_empty_lines = []
    prev_blank = False
    for line in lines:
        if line:
            non_empty_lines.append(line)
            prev_blank = False
        elif not prev_blank:
            non_empty_lines.append("")
            prev_blank = True

    return "\n".join(non_empty_lines).strip()

import sys

async def _inner_fetch_page_with_playwright(
    url: str,
    css_selector: Optional[str] = None,
    timeout_seconds: int = 15,
) -> Tuple[int, str, int]:
    """
    Renders a public webpage using Playwright in headless mode.
    Extracts visible inner text from either a specific CSS selector or document body.
    Returns: (http_status, normalized_text, latency_ms)
    """
    start_time = time.time()
    extracted_text = ""
    http_status = 200

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"],
            )
            try:
                context = await browser.new_context(
                    user_agent=USER_AGENT,
                    viewport={"width": 1280, "height": 800},
                )
                try:
                    page = await context.new_page()

                    # Set navigation timeout
                    page.set_default_navigation_timeout(timeout_seconds * 1000)

                    response = await page.goto(url, wait_until="domcontentloaded")
                    if response:
                        http_status = response.status

                    # Allow brief moment for JS rendering if needed
                    await asyncio.sleep(0.5)

                    # Extract target text
                    if css_selector and css_selector.strip():
                        try:
                            locator = page.locator(css_selector.strip()).first
                            if await locator.count() > 0:
                                extracted_text = await locator.inner_text()
                            else:
                                # Fallback to body if selector not matched
                                extracted_text = await page.evaluate("() => document.body.innerText")
                        except Exception:
                            extracted_text = await page.evaluate("() => document.body.innerText")
                    else:
                        extracted_text = await page.evaluate("() => document.body.innerText")
                finally:
                    await context.close()
            finally:
                await browser.close()

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        raise RuntimeError(f"Playwright navigation error for '{url}': {str(e)}")

    latency_ms = int((time.time() - start_time) * 1000)
    normalized = normalize_page_text(extracted_text)
    return http_status, normalized, latency_ms

def _sync_fetch_playwright(
    url: str,
    css_selector: Optional[str] = None,
    timeout_seconds: int = 15,
) -> Tuple[int, str, int]:
    """Runs Playwright fetch in a worker thread with a dedicated WindowsProactorEventLoop."""
    if sys.platform == "win32":
        loop = asyncio.WindowsProactorEventLoopPolicy().new_event_loop()
    else:
        loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(
            _inner_fetch_page_with_playwright(url, css_selector, timeout_seconds)
        )
    finally:
        loop.close()

async def fetch_page_with_playwright(
    url: str,
    css_selector: Optional[str] = None,
    timeout_seconds: int = 15,
) -> Tuple[int, str, int]:
    """
    Renders a public webpage using Playwright in headless mode.
    Automatically handles Windows SelectorEventLoop by delegating to a Proactor loop worker thread.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if sys.platform == "win32" and loop is not None and isinstance(loop, getattr(asyncio, "SelectorEventLoop", ())):
        return await asyncio.to_thread(_sync_fetch_playwright, url, css_selector, timeout_seconds)
    else:
        return await _inner_fetch_page_with_playwright(url, css_selector, timeout_seconds)
