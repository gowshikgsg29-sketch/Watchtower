import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "watchtower.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initializes SQLite tables for targets, snapshots, and detected changes."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS targets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'healthy',
        http_status INTEGER DEFAULT 200,
        check_interval TEXT DEFAULT 'Every 5m',
        selector_mode TEXT DEFAULT 'Full Page DOM',
        css_selector TEXT,
        alert_channels TEXT DEFAULT '["slack","discord"]',
        last_checked TEXT,
        last_changed TEXT,
        error_message TEXT,
        change_count INTEGER DEFAULT 0,
        uptime_percent REAL DEFAULT 100.0,
        latency_ms INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS snapshots (
        id TEXT PRIMARY KEY,
        target_id TEXT NOT NULL,
        version_tag TEXT NOT NULL,
        text_content TEXT NOT NULL,
        word_count INTEGER DEFAULT 0,
        http_status INTEGER DEFAULT 200,
        latency_ms INTEGER DEFAULT 0,
        change_summary TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (target_id) REFERENCES targets (id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS changes (
        id TEXT PRIMARY KEY,
        target_id TEXT NOT NULL,
        target_name TEXT NOT NULL,
        target_url TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        words_added INTEGER DEFAULT 0,
        words_removed INTEGER DEFAULT 0,
        change_type TEXT DEFAULT 'text',
        summary TEXT NOT NULL,
        selector TEXT NOT NULL,
        old_snapshot_id TEXT,
        new_snapshot_id TEXT,
        severity TEXT DEFAULT 'medium',
        FOREIGN KEY (target_id) REFERENCES targets (id) ON DELETE CASCADE
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_snapshots_target ON snapshots(target_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_changes_target ON changes(target_id);")

    conn.commit()
    conn.close()
