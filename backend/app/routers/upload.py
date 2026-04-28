from __future__ import annotations

import hashlib
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import ImageRow, UserRow
from ..schemas import UploadResponse
from .auth import get_current_user_optional
from ..services.storage_service import save_upload_to_disk
from ..settings import get_storage_path

router = APIRouter()

_project_root = Path(__file__).resolve().parents[3]
if str(_project_root) not in sys.path:
    sys.path.append(str(_project_root))


def _compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _compute_phash(abs_path: str) -> str:
    try:
        from engine.fingerprint import generate_phash  # noqa: WPS433
        return generate_phash(abs_path) or ("0" * 16)
    except Exception:
        return "0" * 16


def _phash_similarity(h1: str, h2: str) -> float:
    """Return Hamming-distance-based similarity between two hex pHash strings (0.0–1.0)."""
    if not h1 or not h2 or h1 == "0" * 16 or h2 == "0" * 16:
        return 0.0
    try:
        distance = bin(int(h1, 16) ^ int(h2, 16)).count("1")
        return max(0.0, 1.0 - distance / 64.0)
    except Exception:
        return 0.0


@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db), user: UserRow = Depends(get_current_user_optional)) -> UploadResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported in this MVP.")

    file_bytes = await file.read()
    sha256 = _compute_sha256(file_bytes)

    existing = db.execute(
        select(ImageRow).where(ImageRow.sha256_hash == sha256).where(ImageRow.variant_of.is_(None))
    ).scalars().first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"This exact image is already registered in the DigiWarden Vault (ID: {existing.id}).",
        )

    file.file.seek(0)
    image_id = str(uuid4())
    storage_rel, size_bytes = save_upload_to_disk(file, image_id)
    abs_path = str(get_storage_path() / storage_rel)
    phash = _compute_phash(abs_path)

    root_images = db.execute(
        select(ImageRow).where(ImageRow.variant_of.is_(None))
    ).scalars().all()
    for root_img in root_images:
        if root_img.phash and _phash_similarity(phash, root_img.phash) > 0.90:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"This image is perceptually identical to an asset already in the Vault "
                    f"(ID: {root_img.id}). It cannot be registered as a new original. "
                    "If you believe this is a stolen copy, use the existing asset to generate a DMCA notice."
                ),
            )

    now = datetime.now(timezone.utc)
    row = ImageRow(
        id=image_id,
        user_id=user.id if user else None,
        filename=file.filename or "upload",
        storage_path=storage_rel,
        content_type=file.content_type,
        size_bytes=size_bytes,
        variant_of=None,
        created_at=now,
        sha256_hash=sha256,
        phash=phash,
    )
    db.add(row)
    db.commit()

    return UploadResponse(
        data={
            "image_id": image_id,
            "filename": row.filename,
            "upload_time": now,
            "sha256_hash": sha256,
            "vault_status": "registered",
        }
    )
