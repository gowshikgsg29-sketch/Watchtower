import asyncio
import time
import datetime
import difflib
import uuid
import json
import urllib.parse
from typing import Dict, Any, Tuple, Optional
from database import get_connection
from crawler import fetch_page_with_playwright

# In-memory per-domain throttle tracker
_domain_last_request: Dict[str, float] = {}
MIN_DOMAIN_INTERVAL_SECONDS = 2.0

def _get_domain(url: str) -> str:
    try:
        return urllib.parse.urlparse(url).netloc.lower()
    except Exception:
        return url

def compute_word_diff_stats(old_text: str, new_text: str) -> Tuple[int, int]:
    """Computes count of added and removed words between two normalized text blocks."""
    old_words = old_text.strip().split()
    new_words = new_text.strip().split()

    matcher = difflib.SequenceMatcher(None, old_words, new_words)
    added = 0
    removed = 0

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "insert":
            added += (j2 - j1)
        elif tag == "delete":
            removed += (i2 - i1)
        elif tag == "replace":
            removed += (i2 - i1)
            added += (j2 - j1)

    return added, removed

async def perform_target_check(target_id: str) -> Dict[str, Any]:
    """
    Executes a real monitoring check on a target website using Playwright.
    Compares normalized text against the previous snapshot in SQLite.
    Saves a new snapshot only when meaningful content changes occur.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM targets WHERE id = ?", (target_id,))
    target = cursor.fetchone()

    if not target:
        conn.close()
        raise ValueError(f"Target with ID '{target_id}' not found.")

    if target["status"] == "paused":
        conn.close()
        return {
            "target_id": target_id,
            "has_changes": False,
            "status": "paused",
            "http_status": target["http_status"],
            "latency_ms": target["latency_ms"],
            "words_added": 0,
            "words_removed": 0,
            "message": "Target is paused. Resume target to execute checks.",
        }

    url = target["url"]
    domain = _get_domain(url)

    # Per-domain rate limit enforcement
    now_ts = time.time()
    last_req = _domain_last_request.get(domain, 0.0)
    if (now_ts - last_req) < MIN_DOMAIN_INTERVAL_SECONDS:
        await asyncio.sleep(MIN_DOMAIN_INTERVAL_SECONDS - (now_ts - last_req))
    _domain_last_request[domain] = time.time()

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    http_status = 200
    text_content = ""
    latency_ms = 0
    check_error = None

    # Execute fetch with limited retry (1 retry on error)
    for attempt in range(2):
        try:
            http_status, text_content, latency_ms = await fetch_page_with_playwright(
                url=url,
                css_selector=target["css_selector"],
                timeout_seconds=15,
            )
            check_error = None
            break
        except Exception as e:
            check_error = str(e)
            if attempt == 0:
                await asyncio.sleep(1.0)

    # Handle error if check failed or returned HTTP 4xx/5xx error status
    if check_error or (http_status and http_status >= 400):
        err_msg = check_error or f"HTTP {http_status} Server Error"
        err_status = http_status if (http_status and http_status >= 400) else 502
        cursor.execute(
            """
            UPDATE targets
            SET status = 'alert',
                http_status = ?,
                last_checked = ?,
                error_message = ?,
                latency_ms = ?
            WHERE id = ?
            """,
            (err_status, now_iso, err_msg, latency_ms, target_id),
        )

        # Log incident in changes table
        change_id = f"chg-{uuid.uuid4().hex[:8]}"
        cursor.execute(
            """
            INSERT INTO changes (id, target_id, target_name, target_url, timestamp, words_added, words_removed, change_type, summary, selector, severity)
            VALUES (?, ?, ?, ?, ?, 0, 0, 'status_error', ?, ?, 'critical')
            """,
            (
                change_id,
                target_id,
                target["name"],
                url,
                now_iso,
                f"Monitoring Check Failed: {err_msg}",
                target["css_selector"] or "Full Page",
            ),
        )
        conn.commit()
        conn.close()

        return {
            "target_id": target_id,
            "has_changes": True,
            "status": "alert",
            "http_status": err_status,
            "latency_ms": latency_ms,
            "words_added": 0,
            "words_removed": 0,
            "message": f"Check failed: {err_msg}",
        }

    # Fetch latest snapshot to compare
    cursor.execute(
        """
        SELECT * FROM snapshots
        WHERE target_id = ?
        ORDER BY created_at DESC LIMIT 1
        """,
        (target_id,),
    )
    prev_snapshot = cursor.fetchone()

    word_count = len(text_content.split())
    has_changes = False
    words_added = 0
    words_removed = 0
    message = ""

    if not prev_snapshot:
        # Initial baseline snapshot
        snap_id = f"snap-{uuid.uuid4().hex[:8]}"
        version_tag = "v1.0 (Initial)"
        cursor.execute(
            """
            INSERT INTO snapshots (id, target_id, version_tag, text_content, word_count, http_status, latency_ms, change_summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Initial baseline snapshot captured.', ?)
            """,
            (snap_id, target_id, version_tag, text_content, word_count, http_status, latency_ms, now_iso),
        )
        cursor.execute(
            """
            UPDATE targets
            SET status = 'healthy',
                http_status = ?,
                last_checked = ?,
                last_changed = 'Initial snapshot',
                error_message = NULL,
                change_count = 1,
                latency_ms = ?
            WHERE id = ?
            """,
            (http_status, now_iso, latency_ms, target_id),
        )
        message = "Initial baseline snapshot captured successfully."
    else:
        prev_text = prev_snapshot["text_content"]

        if prev_text == text_content:
            # NO meaningful content change
            cursor.execute(
                """
                UPDATE targets
                SET status = 'healthy',
                    http_status = ?,
                    last_checked = ?,
                    error_message = NULL,
                    latency_ms = ?
                WHERE id = ?
                """,
                (http_status, now_iso, latency_ms, target_id),
            )
            has_changes = False
            message = "Page checked. No meaningful content changes detected."
        else:
            # Meaningful content change detected!
            has_changes = True
            words_added, words_removed = compute_word_diff_stats(prev_text, text_content)

            # Determine next version tag
            cursor.execute("SELECT COUNT(*) as cnt FROM snapshots WHERE target_id = ?", (target_id,))
            version_num = cursor.fetchone()["cnt"] + 1
            version_tag = f"v1.{version_num - 1}"

            summary = f"Detected changes: +{words_added} words added, -{words_removed} words removed."
            snap_id = f"snap-{uuid.uuid4().hex[:8]}"

            cursor.execute(
                """
                INSERT INTO snapshots (id, target_id, version_tag, text_content, word_count, http_status, latency_ms, change_summary, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (snap_id, target_id, version_tag, text_content, word_count, http_status, latency_ms, summary, now_iso),
            )

            # Log change record
            change_id = f"chg-{uuid.uuid4().hex[:8]}"
            cursor.execute(
                """
                INSERT INTO changes (id, target_id, target_name, target_url, timestamp, words_added, words_removed, change_type, summary, selector, old_snapshot_id, new_snapshot_id, severity)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'text', ?, ?, ?, ?, 'medium')
                """,
                (
                    change_id,
                    target_id,
                    target["name"],
                    url,
                    now_iso,
                    words_added,
                    words_removed,
                    summary,
                    target["css_selector"] or "Full Page DOM",
                    prev_snapshot["id"],
                    snap_id,
                ),
            )

            # Update target
            cursor.execute(
                """
                UPDATE targets
                SET status = 'healthy',
                    http_status = ?,
                    last_checked = ?,
                    last_changed = ?,
                    error_message = NULL,
                    change_count = change_count + 1,
                    latency_ms = ?
                WHERE id = ?
                """,
                (http_status, now_iso, now_iso, latency_ms, target_id),
            )
            message = f"Meaningful content change detected (+{words_added}/-{words_removed} words). New version {version_tag} archived."

    conn.commit()
    conn.close()

    return {
        "target_id": target_id,
        "has_changes": has_changes,
        "status": "healthy",
        "http_status": http_status,
        "latency_ms": latency_ms,
        "words_added": words_added,
        "words_removed": words_removed,
        "message": message,
    }
