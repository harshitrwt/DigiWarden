# DigiPatron

DigiPatron reconstructs the lifecycle of digital media so teams can fingerprint an original asset, compare it against known copies, visualize propagation, and generate DMCA notices from the resulting evidence.

## Stack
- **Backend:** FastAPI + SQLAlchemy
- **Frontend:** React + Vite + D3
- **Engine:** pHash + ORB with optional semantic embeddings

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/assets` to `http://localhost:8000` by default.

## Workflow
1. Upload the original image.
2. Optionally upload candidate copies to compare against the original.
3. Trigger analysis and poll the live backend job status.
4. Inspect the dashboard, similarity report, propagation tree, and DMCA notice draft.

## Docker
```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

By default Docker runs with `ENABLE_DEMO_VARIANTS=false`, so the system only analyzes real uploaded variants unless you explicitly enable demo data.
