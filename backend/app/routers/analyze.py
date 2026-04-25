from __future__ import annotations

import json
import sys
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import ImageRow
from ..schemas import AnalysisResultResponse, FingerprintResponse, ProcessingResponse
from ..services.analysis_service import create_analysis_job, get_latest_job, run_analysis_job_background

router = APIRouter()


@router.post("/analyze/{image_id}", status_code=202, response_model=ProcessingResponse)
def analyze_image(
    image_id: str,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
) -> ProcessingResponse:
    image = db.get(ImageRow, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")

    job = create_analysis_job(db, image_id)
    background.add_task(run_analysis_job_background, job.id)

    return ProcessingResponse(message="Analysis started. Polling recommended.", job_id=job.id)


@router.get("/analyze/{image_id}/result", response_model=AnalysisResultResponse)
def get_analysis_result(image_id: str, db: Session = Depends(get_db)) -> AnalysisResultResponse:
    job = get_latest_job(db, image_id)
    if not job:
        raise HTTPException(status_code=404, detail="No analysis job found. Call POST /api/analyze/{image_id} first.")
    if job.status != "complete" or not job.result_json:
        raise HTTPException(status_code=202, detail=f"Analysis status: {job.status}")
    return AnalysisResultResponse(data=json.loads(job.result_json))


@router.get("/fingerprint/{image_id}", response_model=FingerprintResponse)
def get_fingerprint(image_id: str, db: Session = Depends(get_db)) -> FingerprintResponse:
    image = db.get(ImageRow, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")

    # Make sure engine is importable when running from backend/ (MVP packaging shortcut).
    project_root = Path(__file__).resolve().parents[3]
    if str(project_root) not in sys.path:
        sys.path.append(str(project_root))
    from engine.fingerprint import extract_all_fingerprints  # noqa: WPS433

    from ..settings import get_storage_path

    abs_path = str(get_storage_path() / image.storage_path)
    fp = extract_all_fingerprints(abs_path)
    orb = fp.get("orb")
    semantic = fp.get("semantic")

    return FingerprintResponse(
        data={
            "image_id": image.id,
            "phash": fp.get("phash") or "0" * 16,
            "orb_descriptor_count": int(0 if orb is None else len(orb)),
            "semantic_dim": None if semantic is None else int(len(semantic)),
        }
    )
