import asyncio
import sys
from security import is_safe_public_url
from database import init_db, get_connection
from monitor import perform_target_check
import uuid
import datetime

def test_ssrf():
    print("--- Testing SSRF Validation ---")
    bad_urls = [
        "http://localhost:8000",
        "http://127.0.0.1:5000",
        "http://0.0.0.0:80",
        "http://192.168.1.100",
        "http://10.0.0.5",
        "http://172.16.0.1",
        "http://169.254.169.254/latest/meta-data/",
        "ftp://example.com",
        "file:///etc/passwd",
        "javascript:alert(1)",
    ]
    for url in bad_urls:
        safe, reason = is_safe_public_url(url)
        assert not safe, f"Expected {url} to be blocked! Reason was: {reason}"
        print(f"[BLOCKED OK] {url} -> {reason}")

    good_urls = [
        "https://example.com",
        "https://httpbin.org/html",
    ]
    for url in good_urls:
        safe, reason = is_safe_public_url(url)
        assert safe, f"Expected {url} to be allowed! Reason was: {reason}"
        print(f"[ALLOWED OK] {url}")

    print("SSRF security tests passed successfully!\n")

def test_crawler_and_sqlite():
    asyncio.run(_async_test_crawler_and_sqlite())

async def _async_test_crawler_and_sqlite():
    print("--- Testing Database & Playwright Extraction ---")
    init_db()

    conn = get_connection()
    cursor = conn.cursor()

    target_id = f"test-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    cursor.execute(
        """
        INSERT INTO targets (id, name, url, code, status, http_status, check_interval, selector_mode, css_selector, created_at)
        VALUES (?, 'Example Domain', 'https://example.com', 'EXM', 'healthy', 200, 'Every 5m', 'Full Page DOM', NULL, ?)
        """,
        (target_id, now_iso),
    )
    conn.commit()
    conn.close()

    print(f"Enrolled target '{target_id}' (https://example.com). Executing check 1 (initial baseline)...")
    res1 = await perform_target_check(target_id)
    print("Result 1:", res1)
    assert res1["status"] == "healthy"
    assert not res1["has_changes"]

    # Verify snapshot in DB
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM snapshots WHERE target_id = ?", (target_id,))
    snaps = cursor.fetchall()
    print(f"Snapshots in DB: {len(snaps)}")
    assert len(snaps) == 1
    print("Snapshot 1 text excerpt:", snaps[0]["text_content"][:100], "...")

    print("\nExecuting check 2 (no changes expected)...")
    res2 = await perform_target_check(target_id)
    print("Result 2:", res2)
    assert not res2["has_changes"]
    cursor.execute("SELECT * FROM snapshots WHERE target_id = ?", (target_id,))
    snaps2 = cursor.fetchall()
    assert len(snaps2) == 1, "Snapshot count should remain 1 when no changes occurred!"
    print("Verified: No redundant snapshot created when text is identical.")

    # Clean up test target
    cursor.execute("DELETE FROM snapshots WHERE target_id = ?", (target_id,))
    cursor.execute("DELETE FROM changes WHERE target_id = ?", (target_id,))
    cursor.execute("DELETE FROM targets WHERE id = ?", (target_id,))
    conn.commit()
    conn.close()

    print("\nAll Playwright + SQLite integration tests passed!")

def test_target_update():
    asyncio.run(_async_test_target_update())

async def _async_test_target_update():
    print("--- Testing Target Update & Interval Modification ---")
    init_db()
    from app import update_target
    from models import TargetUpdateRequest
    import scheduler
    from scheduler import start_scheduler, shutdown_scheduler

    start_scheduler()

    target_id = f"test-upd-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO targets (id, name, url, code, status, http_status, check_interval, selector_mode, css_selector, created_at)
        VALUES (?, 'Update Test Target', 'https://example.com', 'UPD', 'healthy', 200, 'Every 15 minutes', 'Full Page DOM', NULL, ?)
        """,
        (target_id, now_iso),
    )
    conn.commit()
    conn.close()

    # Schedule initial job
    scheduler.schedule_target_job(target_id, "Every 15 minutes")
    job1 = scheduler.scheduler.get_job(f"watchtower-job-{target_id}")
    assert job1 is not None
    assert job1.trigger.interval.total_seconds() == 900

    # Call update_target to edit check_interval to Every 1 minute
    res = update_target(target_id, TargetUpdateRequest(check_interval="Every 1 minute"))
    assert res["check_interval"] == "Every 1 minute"

    # Verify DB updated
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT check_interval FROM targets WHERE id = ?", (target_id,))
    row = cursor.fetchone()
    assert row["check_interval"] == "Every 1 minute"

    # Verify scheduled job updated
    job2 = scheduler.scheduler.get_job(f"watchtower-job-{target_id}")
    assert job2 is not None
    assert job2.trigger.interval.total_seconds() == 60
    print("Verified: Target interval updated in DB and scheduler job trigger changed to 60s.")

    # Cleanup
    cursor.execute("DELETE FROM targets WHERE id = ?", (target_id,))
    conn.commit()
    conn.close()
    scheduler.remove_target_job(target_id)
    shutdown_scheduler()
    print("Target update & interval modification test passed successfully!\n")

if __name__ == "__main__":
    test_ssrf()
    test_crawler_and_sqlite()
    test_target_update()
