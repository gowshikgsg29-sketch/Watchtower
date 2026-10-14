import asyncio
import uuid
import datetime
from database import init_db, get_connection
from monitor import perform_target_check

SEED_TARGETS = [
    {
        "name": "Example Documentation",
        "url": "https://example.com",
        "code": "EXM",
        "check_interval": "Every 5m",
        "selector_mode": "Full Page DOM",
        "css_selector": None,
    },
    {
        "name": "HTTPBin HTML Test",
        "url": "https://httpbin.org/html",
        "code": "HBH",
        "check_interval": "Every 1m",
        "selector_mode": "CSS Selector #content",
        "css_selector": "body",
    },
]

async def seed_initial_data():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as cnt FROM targets")
    count = cursor.fetchone()["cnt"]

    if count > 0:
        print(f"Database already contains {count} targets. Skipping initial seed.")
        conn.close()
        return

    print("Seeding initial public targets into SQLite database...")
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    seeded_ids = []
    for item in SEED_TARGETS:
        target_id = f"site-{uuid.uuid4().hex[:8]}"
        cursor.execute(
            """
            INSERT INTO targets (id, name, url, code, status, http_status, check_interval, selector_mode, css_selector, alert_channels, last_checked, last_changed, change_count, uptime_percent, latency_ms, created_at)
            VALUES (?, ?, ?, ?, 'healthy', 200, ?, ?, ?, '["slack","discord"]', NULL, 'Pending initial check', 0, 100.0, 0, ?)
            """,
            (
                target_id,
                item["name"],
                item["url"],
                item["code"],
                item["check_interval"],
                item["selector_mode"],
                item["css_selector"],
                now_iso,
            ),
        )
        seeded_ids.append(target_id)

    conn.commit()
    conn.close()

    # Capture initial Playwright snapshots
    for tid in seeded_ids:
        print(f"Executing initial Playwright snapshot capture for '{tid}'...")
        try:
            res = await perform_target_check(tid)
            print(f"  Result: {res['message']} (Latency: {res['latency_ms']}ms)")
        except Exception as e:
            print(f"  Warning during initial check for {tid}: {e}")

    print("Initial seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_initial_data())
