# Watchtower — Website Change Detector

Watchtower is a website monitoring application that automatically checks websites for content changes and helps users track updates through a dashboard.

## Features

- **Website Monitoring:** Add websites and configure monitoring intervals.
- **Change Detection:** Detect changes in website content.
- **Change History:** View previously detected changes.
- **Visual Diff Inspector:** Compare content before and after a change.
- **Scheduled Monitoring:** Automatically check websites at configured intervals.
- **Dashboard:** View monitored websites and their status.

## Technologies Used

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS

**Backend**
- Python
- FastAPI
- SQLite
- Playwright
- APScheduler

## Project Structure

```text
Watchtower/
├── backend/      # Python backend and monitoring logic
├── src/          # React frontend
├── index.html
├── package.json
└── README.md
```

## Run Locally

### 1. Start the backend

Open a terminal and navigate to the backend folder:

```bash
cd backend
```

Install the required Python packages using the project's dependency file, if provided, and start the server:

```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Backend API documentation: http://127.0.0.1:8000/docs

### 2. Start the frontend

Open another terminal in the project root:

```bash
npm install
npm run dev
```

Open the local URL displayed in the terminal, usually http://localhost:5173.

## Purpose

Watchtower demonstrates website monitoring, automated change detection, backend API development, and a web-based interface for inspecting changes.

## Note

This project is currently intended for local development and demonstration. Production deployment requires appropriate security configuration and deployment of both the frontend and backend.
