import asyncio
import logging
import re
import datetime
from typing import Dict, Any, Optional, Set, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from database import get_connection
from monitor import perform_target_check

# Setup clean logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("watchtower.scheduler")

scheduler: Optional[AsyncIOScheduler] = None
_running_checks: Set[str] = set()
_lock = asyncio.Lock()

def parse_interval_to_seconds(interval_str: Optional[str]) -> int:
    """
    Parses check interval string into seconds.
    Supports intervals from 10 seconds up to 24 hours across all UI and API formats.
    Examples:
      - 'Every 1 minute' / '1m' / '1 min' / '1' -> 60
      - 'Every 5 minutes' / '5m' / '5 mins' / '5' -> 300
      - 'Every 10 minutes' / '10m' / '10' -> 600
      - 'Every 15 minutes' / '15m' / '15' -> 900
      - 'Every 30 minutes' / '30m' / '30' -> 1800
      - 'Hourly' / 'Every 1 hour' / '1h' / '60' -> 3600
      - 'Every 2 hours' / '2h' -> 7200
      - 'Every 6 hours' / '6h' -> 21600
      - 'Every 12 hours' / '12h' -> 43200
      - 'Daily' / 'Every 24 hours' / '24h' -> 86400
    """
    if not interval_str:
        return 300  # Default 5 minutes

    s = interval_str.strip().lower()

    if "daily" in s or "24h" in s or "24 hour" in s or "24 hr" in s:
        return 86400
    if "hourly" in s or "1h" in s or "1 hour" in s or "1 hr" in s:
        return 3600

    # Match pure digits (minutes if <= 120, else raw seconds)
    if s.isdigit():
        val = int(s)
        return max(60, val * 60) if val <= 120 else max(10, val)

    # Match digits + unit
    match = re.search(r"(\d+)\s*(m(?:in(?:ute)?s?)?|h(?:(?:ou)?rs?)?|d(?:ays?)?|s(?:ec(?:ond)?s?)?)", s)
    if match:
        val = int(match.group(1))
        unit = match.group(2)
        if unit.startswith("s"):
            return max(10, val)
        if unit.startswith("m"):
            return max(60, val * 60)
        if unit.startswith("h"):
            return max(3600, val * 3600)
        if unit.startswith("d"):
            return max(86400, val * 86400)

    return 300  # Default 5 minutes

def _get_job_id(target_id: str) -> str:
    return f"watchtower-job-{target_id}"

async def scheduled_check_worker(target_id: str):
    """
    Worker function executed by APScheduler on each trigger.
    Enforces concurrency checks, checks database status, executes Playwright check,
    and guarantees errors are caught and logged without crashing the scheduler.
    """
    # Overlapping execution check
    async with _lock:
        if target_id in _running_checks:
            logger.warning(f"[SCHEDULER] Check already in progress for target '{target_id}'. Skipping overlapping check.")
            return
        _running_checks.add(target_id)

    try:
        # Check SQLite to ensure target exists and is not paused
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT status, name, url FROM targets WHERE id = ?", (target_id,))
        target = cursor.fetchone()
        conn.close()

        if not target:
            logger.info(f"[SCHEDULER] Target '{target_id}' was removed. Unregistering job.")
            remove_target_job(target_id)
            return

        if target["status"] == "paused":
            logger.info(f"[SCHEDULER] Target '{target['name']}' ({target_id}) is paused. Skipping scheduled check.")
            return

        logger.info(f"[SCHEDULER] >>> Triggering scheduled check for '{target['name']}' ({target['url']})")
        result = await perform_target_check(target_id)
        logger.info(
            f"[SCHEDULER] <<< Completed check for '{target['name']}': status={result['status']} | changes={result['has_changes']} | latency={result['latency_ms']}ms"
        )
    except Exception as e:
        logger.error(f"[SCHEDULER] Exception during scheduled check for target '{target_id}': {e}", exc_info=True)
    finally:
        async with _lock:
            _running_checks.discard(target_id)

def schedule_target_job(target_id: str, interval_str: str, initial_delay_seconds: Optional[int] = None):
    """Schedules or updates an autonomous interval job for a target."""
    global scheduler
    if not scheduler or not scheduler.running:
        logger.warning(f"[SCHEDULER] Cannot schedule job for {target_id}: scheduler is not running.")
        return

    seconds = parse_interval_to_seconds(interval_str)
    job_id = _get_job_id(target_id)

    # Next run time
    next_run = None
    if initial_delay_seconds is not None:
        next_run = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=initial_delay_seconds)
    else:
        next_run = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=seconds)

    # Add or replace job
    scheduler.add_job(
        scheduled_check_worker,
        trigger=IntervalTrigger(seconds=seconds),
        args=[target_id],
        id=job_id,
        name=f"Monitor Target {target_id}",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        next_run_time=next_run,
    )
    logger.info(f"[SCHEDULER] Scheduled autonomous check for target '{target_id}' every {seconds}s ({interval_str}). Next run: {next_run}")

def pause_target_job(target_id: str):
    """Pauses a scheduled job for a target."""
    global scheduler
    if not scheduler:
        return
    job_id = _get_job_id(target_id)
    try:
        job = scheduler.get_job(job_id)
        if job:
            job.pause()
            logger.info(f"[SCHEDULER] Paused job for target '{target_id}'.")
    except Exception as e:
        logger.warning(f"[SCHEDULER] Failed to pause job for '{target_id}': {e}")

def resume_target_job(target_id: str):
    """Resumes a paused job for a target."""
    global scheduler
    if not scheduler:
        return
    job_id = _get_job_id(target_id)
    try:
        job = scheduler.get_job(job_id)
        if job:
            job.resume()
            logger.info(f"[SCHEDULER] Resumed job for target '{target_id}'.")
        else:
            # Reschedule if job doesn't exist
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT check_interval FROM targets WHERE id = ?", (target_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                schedule_target_job(target_id, row["check_interval"], initial_delay_seconds=2)
    except Exception as e:
        logger.warning(f"[SCHEDULER] Failed to resume job for '{target_id}': {e}")

def remove_target_job(target_id: str):
    """Removes a target job from the scheduler."""
    global scheduler
    if not scheduler:
        return
    job_id = _get_job_id(target_id)
    try:
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)
            logger.info(f"[SCHEDULER] Removed job for target '{target_id}'.")
    except Exception as e:
        logger.warning(f"[SCHEDULER] Failed to remove job for '{target_id}': {e}")

def sync_all_target_jobs():
    """Reads all targets from SQLite and synchronizes APScheduler jobs."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, status, check_interval FROM targets")
    targets = cursor.fetchall()
    conn.close()

    db_target_ids = {t["id"] for t in targets}
    if scheduler:
        # Purge any orphaned jobs for targets that no longer exist in SQLite
        for job in scheduler.get_jobs():
            if job.id.startswith("watchtower-job-"):
                job_target_id = job.id.replace("watchtower-job-", "")
                if job_target_id not in db_target_ids:
                    scheduler.remove_job(job.id)
                    logger.info(f"[SCHEDULER] Purged orphaned job '{job.id}'.")

    active_count = 0
    paused_count = 0
    for t in targets:
        schedule_target_job(t["id"], t["check_interval"])
        if t["status"] == "paused":
            pause_target_job(t["id"])
            paused_count += 1
        else:
            active_count += 1

    logger.info(f"[SCHEDULER] Synchronized monitoring jobs from SQLite ({active_count} active, {paused_count} paused).")

def start_scheduler():
    """Initializes and starts the APScheduler AsyncIOScheduler instance."""
    global scheduler
    if scheduler and scheduler.running:
        logger.info("[SCHEDULER] Scheduler is already running.")
        return

    logger.info("[SCHEDULER] Initializing AsyncIOScheduler engine...")
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.start()
    sync_all_target_jobs()
    logger.info("[SCHEDULER] Background scheduler started successfully.")

def shutdown_scheduler():
    """Cleanly stops the APScheduler instance."""
    global scheduler

    if scheduler:
        if scheduler.running:
            logger.info("[SCHEDULER] Shutting down scheduler...")
            scheduler.shutdown(wait=False)
            logger.info("[SCHEDULER] Scheduler shutdown requested.")

        scheduler = None
        logger.info("[SCHEDULER] Scheduler shutdown complete.")

def get_scheduler_status() -> Dict[str, Any]:
    """Returns runtime telemetry for the scheduler."""
    global scheduler
    if not scheduler:
        return {"running": False, "jobs_count": 0, "jobs": [], "running_checks": []}

    jobs_info = []
    for job in scheduler.get_jobs():
        jobs_info.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "pending": job.pending,
            "paused": job.next_run_time is None,
        })

    return {
        "running": scheduler.running,
        "jobs_count": len(jobs_info),
        "jobs": jobs_info,
        "running_checks": list(_running_checks),
    }
