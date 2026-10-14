import asyncio
import sys
import datetime
import uuid
from unittest.mock import patch, AsyncMock

from database import init_db, get_connection
import scheduler
from scheduler import (
    start_scheduler,
    shutdown_scheduler,
    schedule_target_job,
    pause_target_job,
    resume_target_job,
    remove_target_job,
    get_scheduler_status,
    parse_interval_to_seconds,
    scheduled_check_worker,
    _running_checks,
    _lock,
)

async def run_fast_scheduler_tests():
    print("=== WATCHTOWER APSCHEDULER UNIT & INTEGRATION TEST SUITE ===", flush=True)
    init_db()

    # -------------------------------------------------------------
    # 1. Test Interval String Parsing (15 minutes to 24 hours + dev)
    # -------------------------------------------------------------
    print("\n[TEST 1] Verifying Check Interval Parsing (15m to 24h)...", flush=True)
    test_cases = [
        ("Every 1 minute", 60),
        ("Every 5 minutes", 300),
        ("Every 15 minutes", 900),
        ("Every 30 minutes", 1800),
        ("Hourly", 3600),
        ("Every 1 hour", 3600),
        ("Every 2 hours", 7200),
        ("Every 6 hours", 21600),
        ("Every 10 minutes", 600),
        ("Every 12 hours", 43200),
        ("Daily", 86400),
        ("Every 24 hours", 86400),
        ("1m", 60),
        ("5m", 300),
        ("1h", 3600),
        ("24h", 86400),
        ("1", 60),
        ("5", 300),
        ("15", 900),
        ("60", 3600),
        ("Invalid string fallback", 300),
    ]
    for text, expected in test_cases:
        res = parse_interval_to_seconds(text)
        assert res == expected, f"Failed for '{text}': got {res}, expected {expected}"
        print(f"  [OK] '{text}' -> {res}s", flush=True)
    print("  [PASS] All interval specifications (15m to 24h + shorthand) parsed correctly.", flush=True)

    # -------------------------------------------------------------
    # 2. Test Scheduler Lifecycle: Start & Status
    # -------------------------------------------------------------
    print("\n[TEST 2] Verifying Scheduler Lifecycle (Start & Status)...", flush=True)
    start_scheduler()
    status = get_scheduler_status()
    assert status["running"] is True, "Scheduler should be marked running."
    print(f"  [PASS] APScheduler started successfully. Active jobs: {status['jobs_count']}", flush=True)

    # -------------------------------------------------------------
    # 3. Test Background Job Trigger (Mocked Browser, Fast Execution)
    # -------------------------------------------------------------
    print("\n[TEST 3] Verifying Background Job Scheduling & Autonomous Trigger...", flush=True)
    test_target_id = f"sched-test-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO targets (id, name, url, code, status, http_status, check_interval, selector_mode, last_checked, created_at)
        VALUES (?, 'Unit Test Target', 'https://example.com/test', 'UTT', 'healthy', 200, 'Every 15 minutes', 'Full Page DOM', ?, ?)
        """,
        (test_target_id, now_iso, now_iso),
    )
    conn.commit()
    conn.close()

    mock_check_called = False

    async def mock_perform_check(tid: str):
        nonlocal mock_check_called
        mock_check_called = True
        # Update last_checked in SQLite to simulate real check completion
        c = get_connection()
        cur = c.cursor()
        cur.execute("UPDATE targets SET last_checked = ?, latency_ms = 45 WHERE id = ?", (datetime.datetime.now(datetime.timezone.utc).isoformat(), tid))
        c.commit()
        c.close()
        return {
            "target_id": tid,
            "has_changes": False,
            "status": "healthy",
            "http_status": 200,
            "latency_ms": 45,
            "words_added": 0,
            "words_removed": 0,
            "message": "Mock check executed.",
        }

    # Patch perform_target_check to avoid launching real Chrome during unit test
    with patch("scheduler.perform_target_check", side_effect=mock_perform_check):
        # Schedule job to trigger in 1 second
        schedule_target_job(test_target_id, "Every 15 minutes", initial_delay_seconds=1)

        status_after_add = get_scheduler_status()
        matching = [j for j in status_after_add["jobs"] if test_target_id in j["id"]]
        assert len(matching) == 1, "Target job should be registered."
        print(f"  Job registered: {matching[0]['id']}, next_run: {matching[0]['next_run_time']}", flush=True)

        print("  Waiting 1.5s for autonomous background trigger to fire...", flush=True)
        await asyncio.sleep(1.5)

        assert mock_check_called is True, "Background job must fire automatically without manual click!"

        # Verify SQLite last_checked was updated
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT last_checked FROM targets WHERE id = ?", (test_target_id,))
        updated_time = cursor.fetchone()["last_checked"]
        conn.close()

        assert updated_time != now_iso, "last_checked must be updated in SQLite by the job!"
        print(f"  [PASS] Autonomous job fired and updated SQLite timestamp to: {updated_time}", flush=True)

    # -------------------------------------------------------------
    # 4. Test Paused Target Behavior (Ensuring Paused Sites Are Skipped)
    # -------------------------------------------------------------
    print("\n[TEST 4] Verifying Paused Target Behavior...", flush=True)
    # Mark target as paused in DB
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE targets SET status = 'paused' WHERE id = ?", (test_target_id,))
    conn.commit()
    conn.close()

    # Pause job in scheduler
    pause_target_job(test_target_id)

    paused_check_called = False
    async def mock_paused_check(tid: str):
        nonlocal paused_check_called
        paused_check_called = True
        return {}

    with patch("scheduler.perform_target_check", side_effect=mock_paused_check):
        # Trigger worker directly to verify guard
        await scheduled_check_worker(test_target_id)
        assert paused_check_called is False, "Paused targets must NOT be checked!"
        print("  [PASS] Worker correctly checked target status in SQLite and skipped paused target.", flush=True)

    # Resume target
    print("  Testing Resume Target...", flush=True)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE targets SET status = 'healthy' WHERE id = ?", (test_target_id,))
    conn.commit()
    conn.close()
    resume_target_job(test_target_id)
    print("  [PASS] Target resumed successfully.", flush=True)

    # -------------------------------------------------------------
    # 5. Test Overlap & Concurrency Guard (Prevent Duplicate Concurrent Checks)
    # -------------------------------------------------------------
    print("\n[TEST 5] Verifying Overlap & Duplicate Check Guard...", flush=True)
    # Manually acquire the lock and mark target as running
    async with _lock:
        _running_checks.add(test_target_id)

    concurrent_call_executed = False
    async def mock_concurrent_check(tid: str):
        nonlocal concurrent_call_executed
        concurrent_call_executed = True
        return {}

    with patch("scheduler.perform_target_check", side_effect=mock_concurrent_check):
        await scheduled_check_worker(test_target_id)
        assert concurrent_call_executed is False, "Concurrent duplicate check must be skipped!"
        print("  [PASS] Concurrent check correctly detected target in _running_checks and skipped execution.", flush=True)

    async with _lock:
        _running_checks.discard(test_target_id)

    # -------------------------------------------------------------
    # 6. Test Error Handling (Failed website doesn't crash scheduler)
    # -------------------------------------------------------------
    print("\n[TEST 6] Verifying Exception Handling & Scheduler Resilience...", flush=True)
    async def mock_failing_check(tid: str):
        raise RuntimeError("Simulated network timeout (HTTP 504 Gateway Timeout)")

    with patch("scheduler.perform_target_check", side_effect=mock_failing_check):
        # Execute worker on failing target
        await scheduled_check_worker(test_target_id)
        # Verify scheduler is still alive
        assert get_scheduler_status()["running"] is True, "Scheduler must remain alive after check exception!"
        assert test_target_id not in _running_checks, "Target must be cleared from _running_checks on error!"
        print("  [PASS] Error was caught cleanly. Scheduler remains running without crash.", flush=True)

    # -------------------------------------------------------------
    # 7. Test Dynamic Interval Update
    # -------------------------------------------------------------
    print("\n[TEST 7] Verifying Dynamic Interval Update...", flush=True)
    schedule_target_job(test_target_id, "Every 15 minutes")
    job = scheduler.scheduler.get_job(f"watchtower-job-{test_target_id}")
    assert job is not None
    assert job.trigger.interval.total_seconds() == 900

    # Update interval to Every 1 minute
    schedule_target_job(test_target_id, "Every 1 minute")
    updated_job = scheduler.scheduler.get_job(f"watchtower-job-{test_target_id}")
    assert updated_job.trigger.interval.total_seconds() == 60
    print("  [PASS] Dynamic interval update updated APScheduler trigger from 900s to 60s.", flush=True)

    # -------------------------------------------------------------
    # 8. Test Scheduler Synchronization Consistency (Restart simulation)
    # -------------------------------------------------------------
    print("\n[TEST 8] Verifying SQLite Synchronization Consistency...", flush=True)
    scheduler.sync_all_target_jobs()
    stat = get_scheduler_status()
    assert stat["running"] is True
    print(f"  [PASS] Synchronized jobs successfully. Total jobs in scheduler: {stat['jobs_count']}", flush=True)

    # -------------------------------------------------------------
    # 9. Test Clean Shutdown
    # -------------------------------------------------------------
    print("\n[TEST 9] Verifying Clean Scheduler Shutdown...", flush=True)
    # Clean up test target
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM targets WHERE id = ?", (test_target_id,))
    conn.commit()
    conn.close()
    remove_target_job(test_target_id)

    shutdown_scheduler()
    status_shutdown = get_scheduler_status()
    assert status_shutdown["running"] is False, "Scheduler should not be running after shutdown."
    print("  [PASS] Scheduler shutdown complete and verified.", flush=True)

    print("\n=== ALL 9 SCHEDULER TESTS PASSED SUCCESSFULLY! ===", flush=True)

async def main():
    try:
        # Enforce a strict 10 second timeout on the entire test suite
        await asyncio.wait_for(run_fast_scheduler_tests(), timeout=10.0)
    except asyncio.TimeoutError:
        print("\n[FAIL] Test suite exceeded 10.0s timeout!", file=sys.stderr)
        sys.exit(1)

def test_scheduler_suite():
    asyncio.run(main())

if __name__ == "__main__":
    asyncio.run(main())
