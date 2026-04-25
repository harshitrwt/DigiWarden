from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import ImageRow
from ..schemas import ImageMetaResponse, JobStatusResponse
from ..services.analysis_service import get_latest_job

router = APIRouter()


@router.get("/images/{image_id}", response_model=ImageMetaResponse)
def get_image_meta(image_id: str, db: Session = Depends(get_db)) -> ImageMetaResponse:
    row = db.get(ImageRow, image_id)
    if not row:
        raise HTTPException(status_code=404, detail="Image not found.")

    url = f"/assets/{row.storage_path.split('/')[-1]}"
    return ImageMetaResponse(
        data={
            "image_id": row.id,
            "filename": row.filename,
            "url": url,
            "upload_time": row.created_at,
            "content_type": row.content_type,
            "size_bytes": row.size_bytes,
            "variant_of": row.variant_of,
        }
    )


@router.get("/images/{image_id}/status", response_model=JobStatusResponse)
def get_image_status(image_id: str, db: Session = Depends(get_db)) -> JobStatusResponse:
    job = get_latest_job(db, image_id)
    if not job:
        return JobStatusResponse(
            data={
                "image_id": image_id,
                "status": "not_started",
                "job_id": None,
                "started_at": None,
                "finished_at": None,
                "error": None,
            }
        )

    return JobStatusResponse(
        data={
            "image_id": image_id,
            "status": job.status,
            "job_id": job.id,
            "started_at": job.started_at,
            "finished_at": job.finished_at,
            "error": job.error,
        }
    )
