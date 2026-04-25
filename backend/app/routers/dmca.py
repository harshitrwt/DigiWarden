from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import DmcaFetchResponse, DmcaGenerateRequest, DmcaGenerateResponse
from ..models import DmcaDraftRow
from ..services.dmca_service import generate_dmca_draft

router = APIRouter()


@router.post("/dmca/generate", response_model=DmcaGenerateResponse)
def generate_dmca(payload: DmcaGenerateRequest, db: Session = Depends(get_db)) -> DmcaGenerateResponse:
    try:
        dmca = generate_dmca_draft(
            db=db,
            infringing_node_id=payload.infringing_node_id,
            owner_name=payload.owner_name,
            owner_email=payload.owner_email,
            root_image_id=payload.root_image_id,
        )
        evidence = None
        if dmca.evidence_json:
            try:
                import json

                evidence = json.loads(dmca.evidence_json)
            except Exception:
                evidence = None
        return DmcaGenerateResponse(
            data={
                "dmca_id": dmca.id,
                "draft_text": dmca.draft_text,
                "evidence": evidence,
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/dmca/{dmca_id}", response_model=DmcaFetchResponse)
def fetch_dmca(dmca_id: str, db: Session = Depends(get_db)) -> DmcaFetchResponse:
    row = db.get(DmcaDraftRow, dmca_id)
    if not row:
        raise HTTPException(status_code=404, detail="DMCA draft not found.")
    return DmcaFetchResponse(
        data={
            "dmca_id": row.id,
            "draft_text": row.draft_text,
            "created_at": row.created_at,
        }
    )

