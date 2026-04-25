from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import ImageRow
from ..schemas import UploadResponse
from ..services.storage_service import save_upload_to_disk

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)) -> UploadResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported in this MVP.")

    image_id = str(uuid4())
    storage_rel, size_bytes = save_upload_to_disk(file, image_id)
    now = datetime.now(timezone.utc)

    row = ImageRow(
        id=image_id,
        filename=file.filename or "upload",
        storage_path=storage_rel,
        content_type=file.content_type,
        size_bytes=size_bytes,
        variant_of=None,
        created_at=now,
    )
    db.add(row)
    db.commit()

    return UploadResponse(
        data={
            "image_id": image_id,
            "filename": row.filename,
            "upload_time": now,
        }
    )

