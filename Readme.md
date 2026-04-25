# DigiPatron (ContentGenome MVP)

This repo is a 3-layer MVP:

- `frontend/` (React/Vite) — currently a simple demo UI (placeholders for TreeViz, ScoreCards, DMCA modal).
- `backend/` (FastAPI) — orchestrates storage + analysis + DMCA drafting.
- `engine/` (pure Python) — fingerprints + similarity + (MVP) propagation tree builder.

## Run locally (Windows / PowerShell)

### 1) Backend
```powershell
cd DigiPatron\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open `http://localhost:8000/docs`.

### 2) Frontend (optional demo)
```powershell
cd DigiPatron\frontend
npm install
$env:VITE_API_BASE_URL="http://localhost:8000/api"
npm run dev
```
Open `http://localhost:5173`.

## Run with Docker
```powershell
cd DigiPatron
docker compose up --build
```

## API Contract
See `docs/API_CONTRACT.md`.
