from __future__ import annotations

import os
from pathlib import Path


def get_storage_path() -> Path:
    """
    Local filesystem storage for the MVP (S3/GCS/Firebase Storage can be added later).

    Default is stable regardless of current working directory:
    `backend/data`
    """
    backend_root = Path(__file__).resolve().parents[1]  # backend/app -> backend
    raw = os.getenv("STORAGE_PATH")
    if not raw:
        return (backend_root / "data").resolve()

    p = Path(raw)
    if not p.is_absolute():
        p = backend_root / p
    return p.resolve()


def get_uploads_path() -> Path:
    return get_storage_path() / "uploads"


def get_db_url() -> str:
    # Default to a SQLite DB colocated with the backend's data folder.
    default_db_path = get_storage_path() / "contentgenome.db"
    return os.getenv("DB_URL", f"sqlite:///{default_db_path.as_posix()}")
