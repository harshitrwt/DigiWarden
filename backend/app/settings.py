from __future__ import annotations

import os
from pathlib import Path


def _is_truthy(raw: str | None, default: bool = False) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


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


def get_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")
    if raw:
        origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
        if origins:
            return origins

    return [
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def demo_variants_enabled() -> bool:
    return _is_truthy(os.getenv("ENABLE_DEMO_VARIANTS"), default=False)


def get_gemini_api_key() -> str | None:
    return os.getenv("GEMINI_API_KEY") or None


def get_google_cse_api_key() -> str | None:
    return os.getenv("GOOGLE_CSE_API_KEY") or None


def get_google_cse_id() -> str | None:
    return os.getenv("GOOGLE_CSE_ID") or None
