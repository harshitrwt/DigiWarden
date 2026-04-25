from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import AnalysisJobRow, DmcaDraftRow


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _find_node_evidence(tree: Dict[str, Any], node_id: str) -> Optional[Dict[str, Any]]:
    for node in tree.get("nodes", []):
        if node.get("id") == node_id:
            return node
    return None


def _latest_complete_job(db: Session, image_id: Optional[str]) -> Optional[AnalysisJobRow]:
    if not image_id:
        return None
    stmt = (
        select(AnalysisJobRow)
        .where(AnalysisJobRow.image_id == image_id)
        .where(AnalysisJobRow.status == "complete")
        .order_by(AnalysisJobRow.finished_at.desc())
        .limit(1)
    )
    return db.execute(stmt).scalars().first()


def _find_job_by_node(db: Session, node_id: str) -> Optional[AnalysisJobRow]:
    stmt = (
        select(AnalysisJobRow)
        .where(AnalysisJobRow.status == "complete")
        .order_by(AnalysisJobRow.finished_at.desc())
    )
    for job in db.execute(stmt).scalars().all():
        if not job.tree_json:
            continue
        try:
            tree = json.loads(job.tree_json)
        except Exception:
            continue
        if _find_node_evidence(tree, node_id):
            return job
    return None


def generate_dmca_draft(
    db: Session,
    infringing_node_id: str,
    owner_name: Optional[str],
    owner_email: Optional[str],
    root_image_id: Optional[str],
) -> DmcaDraftRow:
    job = _latest_complete_job(db, root_image_id) or _find_job_by_node(db, infringing_node_id)
    if not job or not job.tree_json:
        raise ValueError("No completed analysis found for the requested node. Run /api/analyze/{image_id} first.")

    tree = json.loads(job.tree_json)
    evidence_node = _find_node_evidence(tree, infringing_node_id)
    if not evidence_node:
        raise ValueError("Node not found in the latest propagation tree.")

    owner_name = owner_name or "[Your Name]"
    owner_email = owner_email or "[your@email.com]"

    draft = (
        "TO: Copyright Agent / Designated DMCA Contact\n"
        "SUBJECT: DMCA Takedown Notice\n\n"
        f"I, {owner_name}, certify under penalty of perjury that I am the owner (or authorized to act on behalf of the owner)\n"
        "of the copyrighted image described below.\n\n"
        "1) Original work:\n"
        f"- Root Image ID: {job.image_id}\n\n"
        "2) Infringing material:\n"
        f"- Node ID: {infringing_node_id}\n"
        f"- URL (evidence): {evidence_node.get('url')}\n"
        f"- Similarity Score: {evidence_node.get('similarity_score')}\n"
        f"- Detected Mutation: {evidence_node.get('mutation_type')}\n\n"
        "3) Good faith statement:\n"
        "I have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner,\n"
        "its agent, or the law.\n\n"
        "4) Accuracy statement:\n"
        "The information in this notice is accurate, and I am the copyright owner or am authorized to act on the owner's behalf.\n\n"
        "5) Contact:\n"
        f"- Name: {owner_name}\n"
        f"- Email: {owner_email}\n\n"
        f"Signature: {owner_name}\n"
        f"Date: {_now_utc().date().isoformat()}\n"
    )

    dmca = DmcaDraftRow(
        id=str(uuid4()),
        root_image_id=job.image_id,
        infringing_node_id=infringing_node_id,
        owner_name=owner_name,
        owner_email=owner_email,
        draft_text=draft,
        evidence_json=json.dumps(evidence_node),
        created_at=_now_utc(),
    )
    db.add(dmca)
    db.commit()
    db.refresh(dmca)
    return dmca

