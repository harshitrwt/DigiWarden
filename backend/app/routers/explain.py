from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import ExplainNodeRequest, ExplainNodeResponse
from ..services.analysis_service import get_latest_job

log = logging.getLogger(__name__)
router = APIRouter()


@router.post("/explain/{image_id}/node", response_model=ExplainNodeResponse)
def explain_node(image_id: str, payload: ExplainNodeRequest, db: Session = Depends(get_db)) -> ExplainNodeResponse:
    job = get_latest_job(db, image_id)
    if not job or job.status != "complete" or not job.tree_json:
        raise HTTPException(status_code=202, detail="Analysis not ready. Run analysis first and poll.")

    tree = json.loads(job.tree_json)
    node = next((n for n in tree.get("nodes", []) if n.get("id") == payload.node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found.")

    try:
        from ..services.gemini_service import generate_explanation  # noqa: WPS433
        explanation = generate_explanation({
            "mutation_type": node.get("mutation_type", "Unknown"),
            "phash_score": (node.get("breakdown") or {}).get("phash_score", 0),
            "orb_score": (node.get("breakdown") or {}).get("orb_score", 0),
            "combined_score": node.get("similarity_score", 0),
            "authenticity_label": node.get("authenticity_label", "Unknown"),
        })
    except Exception as exc:  # noqa: BLE001
        log.warning("Gemini explanation unavailable (%s), using fallback.", exc)
        mutation = node.get("mutation_type", "Unknown")
        score = node.get("similarity_score", 0)
        label = node.get("authenticity_label", "Unknown")
        explanation = (
            f"This node is classified as '{label}' with a combined similarity score of {score}%. "
            f"Detected transformation: {mutation}. "
            "The perceptual hash and ORB keypoint analysis indicate this image shares significant "
            "structural characteristics with the registered original asset, suggesting it is a "
            "derivative copy."
        )

    return ExplainNodeResponse(
        data={
            "image_id": image_id,
            "node_id": payload.node_id,
            "explanation": explanation,
        }
    )
