# Watchtower — Backend Architecture & API Service

Watchtower's backend is a high-performance, asynchronous monitoring service built with **Python FastAPI**, **Playwright**, and **SQLite**. It performs mission-critical website change detection, headless browser DOM rendering, strict SSRF prevention, and structured content versioning.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Frontend (React + Vite + TypeScript)           │
│                    http://localhost:5173                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                  FastAPI Backend (app.py)                   │
│                    http://127.0.0.1:8000                    │
├──────────────────────────────┬──────────────────────────────┤
│  • SSRF Guard (security.py)  │  • SQLite Engine (database)  │
│  • Playwright Crawler        │  • Diff Versioner (monitor)  │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Key Components

### A. SSRF Security Guard (`security.py`)
Protects internal infrastructure against Server-Side Request Forgery:
- **Protocol validation:** Accepts only `http://` and `https://`.
- **IP blacklist:** Rejects private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- **Loopback & local blocking:** Blocks `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, and `.local` / `.internal` domains.
- **Cloud metadata protection:** Prohibits `169.254.169.254` and link-local endpoints.
- **DNS resolution check:** Uses `socket.getaddrinfo` to resolve hostnames and verify all underlying IP addresses with Python's standard `ipaddress` library before making requests.

### B. Headless Playwright Crawler (`crawler.py`)
- Emulates a modern Chromium desktop browser with realistic User-Agent headers.
- Waits for `domcontentloaded` and client-side JavaScript execution.
- Extracts visible text from either full page `body` or a specific CSS selector (`#content`, `.announcements`, etc.).
- **Heuristic Noise Normalization:**
  - Strips dynamic ISO timestamps, relative time statements (`"18m ago"`), and clock expressions.
  - Normalizes whitespace to prevent false-positive mutations.
  - Transparently acknowledges that heuristic filters reduce common noise but cannot guarantee 100% elimination of all dynamic content.

### C. Persistent Storage (`database.py` & `watchtower.db`)
SQLite database with three core tables:
1. `targets`: Monitoring targets (URL, ticker code, status, interval, last checked, last changed, latency).
2. `snapshots`: Historical text captures and version tags (`v1.0 (Initial)`, `v1.1`, etc.).
3. `changes`: Detected mutations (+words added, -words removed, diff summary, severity).

### D. Change Detection & Versioning Engine (`monitor.py`)
- Checks target URLs on demand or via scheduler.
- Compares normalized text with the latest snapshot using `difflib`.
- **Deduplication:** Saves a new version in `snapshots` **only** when meaningful content changes.
- Records change logs, response latency, and HTTP status codes.
- Implements per-domain request rate limiting (minimum 2.0s interval) to prevent server overload.

---

## 3. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/targets` | List all monitored targets |
| `POST` | `/api/targets` | Enroll a new target with SSRF validation and initial snapshot |
| `GET` | `/api/targets/{id}` | Get target details |
| `POST` | `/api/targets/{id}/check` | Trigger real Playwright check and diff comparison |
| `POST` | `/api/targets/{id}/pause` | Toggle pause/resume on target |
| `DELETE` | `/api/targets/{id}` | Delete target and its historical snapshots |
| `GET` | `/api/targets/{id}/snapshots` | List historical snapshots for a target |
| `GET` | `/api/snapshots/{id}` | Get a specific snapshot |
| `GET` | `/api/changes` | List detected changes feed |
| `GET` | `/api/stats` | Return measured system statistics from SQLite |

---

## 4. Setup & Running

### Requirements
- Python 3.10+
- Playwright Chromium (`playwright install chromium`)

### Quick Start
```bash
# 1. Install dependencies
pip install -r backend/requirements.txt
playwright install chromium

# 2. Seed initial public targets (optional)
python backend/seed.py

# 3. Start the FastAPI backend
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation (Swagger UI) is available at:
`http://127.0.0.1:8000/docs`
