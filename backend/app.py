import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(
        asyncio.WindowsProactorEventLoopPolicy()
    )
import os
import uuid
import json
import datetime
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_connection
from security import is_safe_public_url
from models import (
    TargetCreateRequest,
    TargetUpdateRequest,
    TargetResponse,
    SnapshotResponse,
    ChangeResponse,
    CheckResultResponse,
    SystemStatsResponse,
)
from monitor import perform_target_check
from scheduler import (
    start_scheduler,
    shutdown_scheduler,
    schedule_target_job,
    pause_target_job,
    resume_target_job,
    remove_target_job,
    get_scheduler_status,
    _running_checks,
    _lock,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database on startup
    init_db()
    # Initialize and start APScheduler background monitor
    start_scheduler()
    yield
    # Clean shutdown of APScheduler
    shutdown_scheduler()

app = FastAPI(
    title="Watchtower Telemetry API",
    description="Mission-critical website change detection backend powered by Playwright and SQLite.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _format_target_row(row) -> dict:
    channels = []
    if row["alert_channels"]:
        try:
            channels = json.loads(row["alert_channels"])
        except Exception:
            channels = ["slack", "discord"]

    return {
        "id": row["id"],
        "name": row["name"],
        "url": row["url"],
        "code": row["code"],
        "status": row["status"],
        "http_status": row["http_status"] or 200,
        "check_interval": row["check_interval"] or "Every 5m",
        "selector_mode": row["selector_mode"] or "Full Page DOM",
        "css_selector": row["css_selector"],
        "alert_channels": channels,
        "last_checked": row["last_checked"],
        "last_changed": row["last_changed"],
        "error_message": row["error_message"],
        "change_count": row["change_count"] or 0,
        "uptime_percent": row["uptime_percent"] or 100.0,
        "latency_ms": row["latency_ms"] or 0,
        "created_at": row["created_at"],
    }

@app.get("/api/health")
def health_check():
    return {"status": "operational", "system": "Watchtower Backend", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}

@app.get("/api/targets", response_model=List[TargetResponse])
def list_targets():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM targets ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [_format_target_row(r) for r in rows]

@app.post("/api/targets", response_model=TargetResponse, status_code=status.HTTP_201_CREATED)
async def create_target(payload: TargetCreateRequest):
    # Step 1: Validate URL and enforce SSRF Protection
    is_safe, reason = is_safe_public_url(payload.url)
    if not is_safe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security Validation Error: {reason}",
        )

    # Step 2: Generate short code ticker
    words = payload.name.strip().split()
    if len(words) >= 3:
        code = (words[0][0] + words[1][0] + words[2][0]).upper()
    elif len(words) == 2:
        code = (words[0][:2] + words[1][0]).upper()
    else:
        code = payload.name[:3].upper()

    target_id = f"site-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    channels_json = json.dumps(payload.alert_channels or ["slack", "discord"])

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO targets (id, name, url, code, status, http_status, check_interval, selector_mode, css_selector, alert_channels, last_checked, last_changed, change_count, uptime_percent, latency_ms, created_at)
        VALUES (?, ?, ?, ?, 'healthy', 200, ?, ?, ?, ?, NULL, 'Pending initial check', 0, 100.0, 0, ?)
        """,
        (
            target_id,
            payload.name.strip(),
            payload.url.strip(),
            code,
            payload.check_interval or "Every 5m",
            payload.selector_mode or "Full Page DOM",
            payload.css_selector.strip() if payload.css_selector else None,
            channels_json,
            now_iso,
        ),
    )
    conn.commit()
    conn.close()

    # Step 3: Trigger real initial snapshot capture using Playwright
    try:
        await perform_target_check(target_id)
    except Exception as e:
        # If initial check encounters an error, record error status but keep target
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE targets SET status = 'alert', error_message = ? WHERE id = ?",
            (str(e), target_id),
        )
        conn.commit()
        conn.close()

    # Register target in autonomous background scheduler immediately
    schedule_target_job(target_id, payload.check_interval or "Every 5m")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM targets WHERE id = ?", (target_id,))
    target_row = cursor.fetchone()
    conn.close()

    return _format_target_row(target_row)

@app.get("/api/targets/{target_id}", response_model=TargetResponse)
def get_target(target_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM targets WHERE id = ?", (target_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Target not found.")
    return _format_target_row(row)

@app.patch("/api/targets/{target_id}", response_model=TargetResponse)
@app.put("/api/targets/{target_id}", response_model=TargetResponse)
def update_target(target_id: str, payload: TargetUpdateRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM targets WHERE id = ?", (target_id,))
    target = cursor.fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="Target not found.")

    updates = []
    values = []

    if payload.name is not None:
        updates.append("name = ?")
        values.append(payload.name.strip())

    if payload.url is not None:
        is_safe, reason = is_safe_public_url(payload.url)
        if not is_safe:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security Validation Error: {reason}",
            )
        updates.append("url = ?")
        values.append(payload.url.strip())

    if payload.check_interval is not None:
        updates.append("check_interval = ?")
        values.append(payload.check_interval.strip())

    if payload.selector_mode is not None:
        updates.append("selector_mode = ?")
        values.append(payload.selector_mode.strip())

    if payload.css_selector is not None:
        updates.append("css_selector = ?")
        values.append(payload.css_selector.strip() if payload.css_selector else None)

    if payload.alert_channels is not None:
        updates.append("alert_channels = ?")
        values.append(json.dumps(payload.alert_channels))

    if updates:
        values.append(target_id)
        cursor.execute(f"UPDATE targets SET {', '.join(updates)} WHERE id = ?", tuple(values))
        conn.commit()

    cursor.execute("SELECT * FROM targets WHERE id = ?", (target_id,))
    updated_target = cursor.fetchone()
    conn.close()

    # If check_interval was updated, synchronize scheduled job immediately
    if payload.check_interval is not None:
        new_interval = payload.check_interval.strip()
        schedule_target_job(target_id, new_interval)
        if updated_target["status"] == "paused":
            pause_target_job(target_id)

    return _format_target_row(updated_target)

@app.post("/api/targets/{target_id}/check", response_model=CheckResultResponse)
async def check_target(target_id: str):
    async with _lock:
        if target_id in _running_checks:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A check is already in progress for target '{target_id}'.",
            )
        _running_checks.add(target_id)

    try:
        result = await perform_target_check(target_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Check execution error: {str(e)}")
    finally:
        async with _lock:
            _running_checks.discard(target_id)

@app.post("/api/targets/{target_id}/pause", response_model=TargetResponse)
def pause_target(target_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM targets WHERE id = ?", (target_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Target not found.")

    new_status = "paused" if row["status"] != "paused" else "healthy"
    cursor.execute("UPDATE targets SET status = ? WHERE id = ?", (new_status, target_id))
    conn.commit()

    cursor.execute("SELECT * FROM targets WHERE id = ?", (target_id,))
    updated_row = cursor.fetchone()
    conn.close()

    # Synchronize autonomous scheduler state
    if new_status == "paused":
        pause_target_job(target_id)
    else:
        resume_target_job(target_id)

    return _format_target_row(updated_row)

@app.delete("/api/targets/{target_id}")
def delete_target(target_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM targets WHERE id = ?", (target_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Target not found.")

    cursor.execute("DELETE FROM snapshots WHERE target_id = ?", (target_id,))
    cursor.execute("DELETE FROM changes WHERE target_id = ?", (target_id,))
    cursor.execute("DELETE FROM targets WHERE id = ?", (target_id,))
    conn.commit()
    conn.close()

    # Unregister target job from scheduler
    remove_target_job(target_id)
    return {"success": True, "message": f"Target '{target_id}' and all historical telemetry purged."}

@app.get("/api/scheduler")
def get_scheduler_telemetry():
    """Returns telemetry of running APScheduler jobs and active check executions."""
    return get_scheduler_status()

@app.get("/api/targets/{target_id}/snapshots", response_model=List[SnapshotResponse])
def list_snapshots(target_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM snapshots WHERE target_id = ? ORDER BY created_at DESC",
        (target_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/snapshots/{snapshot_id}", response_model=SnapshotResponse)
def get_snapshot(snapshot_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM snapshots WHERE id = ?", (snapshot_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Snapshot not found.")
    return dict(row)

@app.get("/api/changes", response_model=List[ChangeResponse])
def list_changes(target_id: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if target_id:
        cursor.execute(
            "SELECT * FROM changes WHERE target_id = ? ORDER BY timestamp DESC",
            (target_id,),
        )
    else:
        cursor.execute("SELECT * FROM changes ORDER BY timestamp DESC LIMIT 50")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/stats", response_model=SystemStatsResponse)
def get_system_stats():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM targets")
    total = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as healthy FROM targets WHERE status = 'healthy'")
    healthy = cursor.fetchone()["healthy"]

    cursor.execute("SELECT COUNT(*) as alerts FROM targets WHERE status = 'alert'")
    alerts = cursor.fetchone()["alerts"]

    cursor.execute("SELECT COUNT(*) as paused FROM targets WHERE status = 'paused'")
    paused = cursor.fetchone()["paused"]

    cursor.execute("SELECT COUNT(*) as total_changes FROM changes")
    total_changes = cursor.fetchone()["total_changes"]

    cursor.execute("SELECT AVG(latency_ms) as avg_latency FROM targets WHERE latency_ms > 0")
    avg_latency_row = cursor.fetchone()["avg_latency"]
    avg_latency = int(avg_latency_row) if avg_latency_row else 24

    operational_percent = f"{(healthy / total * 100):.1f}% operational" if total > 0 else "100.0% operational"

    conn.close()
    return {
        "total_targets": total,
        "healthy_targets": healthy,
        "alert_targets": alerts,
        "paused_targets": paused,
        "total_changes": total_changes,
        "avg_latency_ms": avg_latency,
        "operational_percent": operational_percent,
    }
