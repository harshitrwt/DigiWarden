from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import SimilarityResponse, TreeResponse
from ..services.analysis_service import get_latest_job

router = APIRouter()


@router.get("/tree/{image_id}", response_model=TreeResponse)
def get_tree(image_id: str, db: Session = Depends(get_db)) -> TreeResponse:
    job = get_latest_job(db, image_id)
    if not job or job.status != "complete" or not job.tree_json:
        raise HTTPException(status_code=202, detail="Tree not ready. Run analysis first and poll.")
    return TreeResponse(data=json.loads(job.tree_json))


@router.get("/tree/{image_id}/node/{node_id}")
def get_tree_node(image_id: str, node_id: str, db: Session = Depends(get_db)):
    job = get_latest_job(db, image_id)
    if not job or job.status != "complete" or not job.tree_json:
        raise HTTPException(status_code=202, detail="Tree not ready. Run analysis first and poll.")

    tree = json.loads(job.tree_json)
    for node in tree.get("nodes", []):
        if node.get("id") == node_id:
            return {"status": "success", "data": node}
    raise HTTPException(status_code=404, detail="Node not found.")


@router.get("/similarity/{image_id}", response_model=SimilarityResponse)
def get_similarity(image_id: str, db: Session = Depends(get_db)) -> SimilarityResponse:
    job = get_latest_job(db, image_id)
    if not job or job.status != "complete" or not job.matches_json:
        raise HTTPException(status_code=202, detail="Similarity results not ready. Run analysis first and poll.")
    return SimilarityResponse(data=json.loads(job.matches_json))

