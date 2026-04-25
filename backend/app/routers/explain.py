from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import ExplainNodeRequest, ExplainNodeResponse
from ..services.analysis_service import get_latest_job

router = APIRouter()


@router.post("/explain/{image_id}/node", response_model=ExplainNodeResponse)
def explain_node(image_id: str, payload: ExplainNodeRequest, db: Session = Depends(get_db)) -> ExplainNodeResponse:
    """
    Placeholder for "LLM explanation" generation.
    Frontend can call this endpoint to get a plain-language explanation per node.
    """
    job = get_latest_job(db, image_id)
    if not job or job.status != "complete" or not job.tree_json:
        raise HTTPException(status_code=202, detail="Analysis not ready. Run analysis first and poll.")

    tree = json.loads(job.tree_json)
    node = next((n for n in tree.get("nodes", []) if n.get("id") == payload.node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found.")

    explanation = (
        "This node appears to be a derived copy of the root image. "
        f"Detected mutation: {node.get('mutation_type')}. "
        f"Similarity score: {node.get('similarity_score')}. "
        "LLM-generated explanations are not wired yet; this is a deterministic placeholder."
    )

    return ExplainNodeResponse(
        data={
            "image_id": image_id,
            "node_id": payload.node_id,
            "explanation": explanation,
        }
    )

