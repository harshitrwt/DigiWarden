from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import ImageRow
from ..schemas import ImageMetaData, VariantUploadResponse, VariantsListResponse
from ..services.storage_service import save_upload_to_disk

router = APIRouter()


@router.post("/images/{root_image_id}/variants", response_model=VariantUploadResponse)
async def upload_variant(
    root_image_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> VariantUploadResponse:
    root = db.get(ImageRow, root_image_id)
    if not root:
        raise HTTPException(status_code=404, detail="Root image not found.")
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported in this MVP.")

    image_id = str(uuid4())
    storage_rel, size_bytes = save_upload_to_disk(file, image_id)
    now = datetime.now(timezone.utc)

    row = ImageRow(
        id=image_id,
        filename=file.filename or "variant",
        storage_path=storage_rel,
        content_type=file.content_type,
        size_bytes=size_bytes,
        variant_of=root_image_id,
        created_at=now,
    )
    db.add(row)
    db.commit()

    url = f"/assets/{row.storage_path.split('/')[-1]}"
    return VariantUploadResponse(
        data={
            "root_image_id": root_image_id,
            "image_id": image_id,
            "filename": row.filename,
            "url": url,
            "upload_time": now,
        }
    )


@router.get("/images/{root_image_id}/variants", response_model=VariantsListResponse)
def list_variants(
    root_image_id: str,
    include_demo: bool = Query(default=False, description="Include demo-generated variants (filename starts with demo_)"),
    db: Session = Depends(get_db),
) -> VariantsListResponse:
    root = db.get(ImageRow, root_image_id)
    if not root:
        raise HTTPException(status_code=404, detail="Root image not found.")

    stmt = select(ImageRow).where(ImageRow.variant_of == root_image_id).order_by(ImageRow.created_at.asc())
    rows = db.execute(stmt).scalars().all()

    def is_demo(r: ImageRow) -> bool:
        return (r.filename or "").lower().startswith("demo_")

    if not include_demo:
        rows = [r for r in rows if not is_demo(r)]

    items: List[ImageMetaData] = []
    for r in rows:
        url = f"/assets/{r.storage_path.split('/')[-1]}"
        items.append(
            ImageMetaData(
                image_id=r.id,
                filename=r.filename,
                url=url,
                upload_time=r.created_at,
                content_type=r.content_type,
                size_bytes=r.size_bytes,
                variant_of=r.variant_of,
            )
        )

    return VariantsListResponse(data=items)

