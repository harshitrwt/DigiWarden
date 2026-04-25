from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .settings import get_db_url


class Base(DeclarativeBase):
    pass


def _ensure_sqlite_dir(db_url: str) -> None:
    url = make_url(db_url)
    if url.get_backend_name() != "sqlite":
        return
    if not url.database:
        return
    db_path = Path(url.database)
    db_path.parent.mkdir(parents=True, exist_ok=True)


DB_URL = get_db_url()
_ensure_sqlite_dir(DB_URL)

connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}
ENGINE = create_engine(DB_URL, connect_args=connect_args)

SessionLocal = sessionmaker(bind=ENGINE, autocommit=False, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=ENGINE)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

