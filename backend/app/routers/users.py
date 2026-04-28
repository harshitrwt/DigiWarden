from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json

from ..db import get_db
from ..models import ImageRow, AnalysisJobRow, UserRow
from .auth import get_current_user

router = APIRouter()

class VaultItem(BaseModel):
    image_id: str
    filename: str
    created_at: str
    integrity_score: float
    total_copies: int
    infringing_copies: int
    modified_copies: int


@router.get("/users/me/vault")
def get_user_vault(user: UserRow = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find all root images for this user (where variant_of is None)
    images = db.query(ImageRow).filter(ImageRow.user_id == user.id, ImageRow.variant_of == None).order_by(ImageRow.created_at.desc()).all()
    
    vault_items = []
    for img in images:
        job = db.query(AnalysisJobRow).filter(AnalysisJobRow.image_id == img.id).order_by(AnalysisJobRow.started_at.desc()).first()
        
        score = 100.0
        total = 0
        infringing = 0
        modified = 0
        
        if job and job.status == "complete" and job.result_json:
            try:
                res = json.loads(job.result_json)
                score = res.get("integrity_score", 100.0)
                stats = res.get("stats", {})
                infringing = stats.get("infringing", 0) + stats.get("exact_copy", 0)
                modified = stats.get("modified", 0)
                total = infringing + modified
            except Exception:
                pass
                
        vault_items.append(VaultItem(
            image_id=img.id,
            filename=img.filename,
            created_at=img.created_at.isoformat(),
            integrity_score=score,
            total_copies=total,
            infringing_copies=infringing,
            modified_copies=modified
        ))
        
    return {"status": "success", "data": {"vault": vault_items}}
