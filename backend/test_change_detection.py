
import asyncio
import uuid
import datetime

from database import init_db, get_connection
from monitor import perform_target_check
import monitor


def test_change_detection():
    asyncio.run(_async_test_change_detection())

async def _async_test_change_detection():
    init_db()

    target_id = f"test-{uuid.uuid4().hex[:6]}"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO targets
        (id, name, url, code, status, http_status, check_interval,
         selector_mode, css_selector, created_at)
        VALUES (?, ?, ?, ?, 'healthy', 200, 'Every 5m',
                'Full Page DOM', NULL, ?)
        """,
        (target_id, "Controlled Change Test",
         "https://example.com", "TST", now),
    )
    conn.commit()
    conn.close()

    # Simulate the page content changing between checks.
    versions = [
        "Welcome to Watchtower Version 1",
        "Welcome to Watchtower Version 2 New Feature",
    ]

    async def fake_fetch_page(**kwargs):
        text = versions.pop(0)
        return 200, text, 10

    original_fetch = monitor.fetch_page_with_playwright
    monitor.fetch_page_with_playwright = fake_fetch_page

    try:
        first = await perform_target_check(target_id)
        second = await perform_target_check(target_id)

        print("First check:", first["message"])
        print("Second check:", second["message"])

        assert first["has_changes"] is False
        assert second["has_changes"] is True

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) AS total FROM snapshots WHERE target_id = ?",
            (target_id,),
        )
        snapshots = cursor.fetchone()["total"]

        cursor.execute(
            "SELECT COUNT(*) AS total FROM changes WHERE target_id = ?",
            (target_id,),
        )
        changes = cursor.fetchone()["total"]

        conn.close()

        assert snapshots == 2, f"Expected 2 snapshots, got {snapshots}"
        assert changes == 1, f"Expected 1 change record, got {changes}"

        print("Snapshots saved:", snapshots)
        print("Change records:", changes)
        print("PASS: Full change-detection workflow works!")

    finally:
        monitor.fetch_page_with_playwright = original_fetch

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM snapshots WHERE target_id = ?", (target_id,))
        cursor.execute("DELETE FROM changes WHERE target_id = ?", (target_id,))
        cursor.execute("DELETE FROM targets WHERE id = ?", (target_id,))
        conn.commit()
        conn.close()


if __name__ == "__main__":
    asyncio.run(test_change_detection())
