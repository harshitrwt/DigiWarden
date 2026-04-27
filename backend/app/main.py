from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .db import init_db
from .routers import analyze, dmca, explain, images, tree, upload, variants
from .services.storage_service import ensure_storage_dirs
from .settings import get_cors_origins, get_uploads_path


def _ensure_project_root_on_path() -> None:
    project_root = Path(__file__).resolve().parents[2]
    if str(project_root) not in sys.path:
        sys.path.append(str(project_root))


_ensure_project_root_on_path()


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_storage_dirs()
    init_db()
    yield


app = FastAPI(
    title="DigiWarden v2 API (MVP)",
    description="FastAPI backend for fingerprinting, similarity search, propagation trees, and DMCA drafting.",
    version="0.1.0",
    lifespan=lifespan,
)

cors_origins = get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials="*" not in cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "DigiWarden backend is running", "docs": "/docs"}


app.mount("/assets", StaticFiles(directory=str(get_uploads_path()), check_dir=False), name="assets")

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(images.router, prefix="/api", tags=["images"])
app.include_router(analyze.router, prefix="/api", tags=["analysis"])
app.include_router(tree.router, prefix="/api", tags=["tree"])
app.include_router(dmca.router, prefix="/api", tags=["dmca"])
app.include_router(explain.router, prefix="/api", tags=["explain"])
app.include_router(variants.router, prefix="/api", tags=["variants"])
