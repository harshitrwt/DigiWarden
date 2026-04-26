from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from urllib.parse import urlparse
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


def _find_root_node(tree: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    for node in tree.get("nodes", []):
        if node.get("authenticity_label") == "Original":
            return node
    return None


def _platform_name(url: Optional[str]) -> str:
    if not url:
        return "Unknown Source"
    parsed = urlparse(url)
    host = parsed.netloc or parsed.path
    if host.startswith("www."):
        host = host[4:]
    return host or "Unknown Source"


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
    root_node = _find_root_node(tree)

    owner_name = owner_name or "[Your Name]"
    owner_email = owner_email or "[your@email.com]"
    root_reference = None if not root_node else root_node.get("url")
    evidence_url = evidence_node.get("url") or "[no source URL recorded]"
    evidence_platform = _platform_name(evidence_url)
    evidence_similarity = evidence_node.get("similarity_score") or 0
    mutation_type = evidence_node.get("mutation_type") or "Unknown"
    authenticity_label = evidence_node.get("authenticity_label") or "Potentially Infringing"
    breakdown = evidence_node.get("breakdown") or {}

    semantic_score = breakdown.get("semantic_score")
    semantic_score_line = "N/A" if semantic_score is None else f"{semantic_score}%"

    draft = (
        "DMCA TAKEDOWN NOTICE\n"
        f"Date: {_now_utc().date().isoformat()}\n"
        f"To: {evidence_platform} Copyright Agent / Designated DMCA Contact\n"
        "Subject: Notice of Copyright Infringement Under 17 U.S.C. 512(c)\n\n"
        "1. Reporting party\n"
        f"Name: {owner_name}\n"
        f"Email: {owner_email}\n\n"
        "2. Copyrighted work claimed to be infringed\n"
        f"Root image ID: {job.image_id}\n"
        f"Reference asset URL: {root_reference or '[internal asset record]'}\n"
        f"Reference asset filename: {root_node.get('filename') if root_node else '[not available]'}\n\n"
        "3. Infringing material to be removed or disabled\n"
        f"Propagation node ID: {infringing_node_id}\n"
        f"Source URL: {evidence_url}\n"
        f"Source filename: {evidence_node.get('filename') or '[not available]'}\n"
        f"Detected classification: {authenticity_label}\n"
        f"Detected transformation: {mutation_type}\n"
        f"Similarity score: {evidence_similarity}%\n"
        f"pHash similarity: {breakdown.get('phash_score', 'N/A')}%\n"
        f"ORB similarity: {breakdown.get('orb_score', 'N/A')}%\n"
        f"Semantic similarity: {semantic_score_line}\n\n"
        "4. Good-faith statement\n"
        "I have a good-faith belief that the use of the material described above is not authorized by the copyright owner, its agent, or the law.\n\n"
        "5. Accuracy and authority statement\n"
        "I swear, under penalty of perjury, that the information in this notice is accurate and that I am the copyright owner or am authorized to act on behalf of the copyright owner.\n\n"
        "6. Requested action\n"
        "Please expeditiously remove or disable access to the infringing material identified above and preserve records sufficient to identify the responsible account holder.\n\n"
        f"Electronic signature: {owner_name}\n"
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
