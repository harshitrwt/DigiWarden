from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .db import init_db
from .routers import analyze, dmca, explain, images, tree, upload, variants
from .services.storage_service import ensure_storage_dirs
from .settings import get_uploads_path


def _ensure_project_root_on_path() -> None:
    # backend/app/main.py -> backend/app -> backend -> DigiPatron
    project_root = Path(__file__).resolve().parents[2]
    if str(project_root) not in sys.path:
        sys.path.append(str(project_root))


_ensure_project_root_on_path()

app = FastAPI(
    title="ContentGenome v2 API (MVP)",
    description="FastAPI backend for fingerprinting, similarity search, propagation trees, and DMCA drafting.",
    version="0.1.0",
)

# Demo-friendly CORS (lock down later when frontend domain is known)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    ensure_storage_dirs()
    init_db()


@app.get("/")
def root():
    return {"status": "ok", "message": "ContentGenome backend is running", "docs": "/docs"}


# Serve stored images under /assets/<filename>
app.mount("/assets", StaticFiles(directory=str(get_uploads_path()), check_dir=False), name="assets")


# API routes (contract lives in docs/API_CONTRACT.md)
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(images.router, prefix="/api", tags=["images"])
app.include_router(analyze.router, prefix="/api", tags=["analysis"])
app.include_router(tree.router, prefix="/api", tags=["tree"])
app.include_router(dmca.router, prefix="/api", tags=["dmca"])
app.include_router(explain.router, prefix="/api", tags=["explain"])
app.include_router(variants.router, prefix="/api", tags=["variants"])
