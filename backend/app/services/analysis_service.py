from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import AnalysisJobRow, ImageRow
from ..settings import demo_variants_enabled, get_storage_path
from .demo_mutations import generate_demo_variants
from .storage_service import ensure_storage_dirs, save_bytes_to_uploads


def _ensure_project_root_on_path() -> None:
    # backend/app/services -> backend/app -> backend -> DigiPatron (project root)
    project_root = Path(__file__).resolve().parents[3]
    if str(project_root) not in sys.path:
        sys.path.append(str(project_root))


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _load_image_row(db: Session, image_id: str) -> ImageRow:
    row = db.get(ImageRow, image_id)
    if not row:
        raise ValueError(f"Image not found: {image_id}")
    return row


def _storage_abspath(storage_rel_path: str) -> str:
    return str(get_storage_path() / storage_rel_path)


def _isoformat_or_none(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat()


def _classify_counts(matches: List[Dict[str, Any]]) -> Dict[str, int]:
    modified = sum(1 for m in matches if m.get("authenticity_label") == "Modified")
    infringing = sum(1 for m in matches if m.get("authenticity_label") == "Likely Infringing")
    # "total copies detected" excludes "No Match" results
    total = sum(1 for m in matches if m.get("authenticity_label") in {"Original", "Modified", "Likely Infringing"})
    return {"modified": modified, "infringing": infringing, "total": total}


def _compute_integrity_score(modified: int, infringing: int) -> int:
    score = 100 - (infringing * 15 + modified * 5)
    return max(0, int(score))


def create_analysis_job(db: Session, image_id: str) -> AnalysisJobRow:
    job = AnalysisJobRow(
        id=str(uuid4()),
        image_id=image_id,
        status="processing",
        started_at=_now_utc(),
        finished_at=None,
        error=None,
        result_json=None,
        tree_json=None,
        matches_json=None,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def run_analysis_job(db: Session, job_id: str) -> None:
    """
    Runs the full MVP pipeline for an uploaded image:
    - Fingerprint root
    - Compare against variants (user uploads or demo-generated)
    - Similarity scoring (engine)
    - Propagation tree build (engine)
    - Persist results for polling endpoints
    """
    job = db.get(AnalysisJobRow, job_id)
    if not job:
        return

    try:
        _ensure_project_root_on_path()
        from engine.fingerprint import extract_all_fingerprints  # noqa: WPS433
        from engine.similarity import compute_similarity  # noqa: WPS433
        from engine.tree_builder import build_propagation_dag  # noqa: WPS433

        ensure_storage_dirs()

        root = _load_image_row(db, job.image_id)
        root_abs = _storage_abspath(root.storage_path)
        root_url = f"/assets/{Path(root.storage_path).name}"

        root_fp = extract_all_fingerprints(root_abs)

        matches: List[Dict[str, Any]] = []

        def is_demo(row: ImageRow) -> bool:
            return (row.filename or "").lower().startswith("demo_")

        def mutation_from_row(row: ImageRow) -> str:
            if is_demo(row):
                name = Path(row.filename).stem
                name = name[len("demo_") :] if name.lower().startswith("demo_") else name
                return name.replace("_", " ").strip().title() or "Demo Variant"
            return "User Upload"

        def source_kind_from_row(row: ImageRow) -> str:
            return "demo" if is_demo(row) else "user_upload"

        stmt = select(ImageRow).where(ImageRow.variant_of == root.id).order_by(ImageRow.created_at.asc())
        variants = db.execute(stmt).scalars().all()
        user_variants = [v for v in variants if not is_demo(v)]

        candidates = user_variants if user_variants else variants
        if not candidates and demo_variants_enabled():
            demo_variants = generate_demo_variants(root_abs)
            for variant in demo_variants:
                variant_image_id = str(uuid4())
                storage_rel = save_bytes_to_uploads(variant.content, variant_image_id, suffix=variant.suffix)
                variant_row = ImageRow(
                    id=variant_image_id,
                    filename=f"demo_{variant.mutation_type.lower()}{variant.suffix}",
                    storage_path=storage_rel,
                    content_type="image/png" if variant.suffix == ".png" else "image/jpeg",
                    size_bytes=len(variant.content),
                    variant_of=root.id,
                    created_at=_now_utc(),
                )
                db.add(variant_row)
            db.commit()
            variants = db.execute(stmt).scalars().all()
            candidates = variants

        for cand in candidates:
            candidate_abs = _storage_abspath(cand.storage_path)
            candidate_fp = extract_all_fingerprints(candidate_abs)
            sim = compute_similarity(root_fp, candidate_fp)
            created_at = _isoformat_or_none(cand.created_at)

            matches.append(
                {
                    "image_id": cand.id,
                    "url": f"/assets/{Path(cand.storage_path).name}",
                    "filename": cand.filename,
                    "created_at": created_at,
                    "source_kind": source_kind_from_row(cand),
                    "mutation_type": mutation_from_row(cand),
                    "authenticity_label": sim.get("authenticity_label", "No Match"),
                    "similarity_score": float(sim.get("combined_score", 0.0)),
                    "breakdown": sim.get("breakdown", {}),
                }
            )

        counts = _classify_counts(matches)
        integrity = _compute_integrity_score(counts["modified"], counts["infringing"])

        result = {
            "image_id": root.id,
            "integrity_score": integrity,
            "total_copies_detected": counts["total"],
            "infringing_copies": counts["infringing"],
            "modified_copies": counts["modified"],
        }

        # Build propagation DAG using the engine module.
        candidates_for_tree = [
            {
                "image_id": m["image_id"],
                "url": m["url"],
                "filename": m.get("filename"),
                "created_at": m.get("created_at"),
                "breakdown": m.get("breakdown"),
                "source_kind": m.get("source_kind"),
                "authenticity_label": m["authenticity_label"],
                "similarity_score": m["similarity_score"],
                "mutation_type": m["mutation_type"],
            }
            for m in matches
        ]
        tree = build_propagation_dag(
            root_image_id=root.id,
            root_url=root_url,
            candidates=candidates_for_tree,
        )
        tree_node_ids = {node.get("image_id"): node.get("id") for node in tree.get("nodes", [])}
        for match in matches:
            match["node_id"] = tree_node_ids.get(match["image_id"])

        job.status = "complete"
        job.finished_at = _now_utc()
        job.result_json = json.dumps(result)
        job.tree_json = json.dumps(tree)
        job.matches_json = json.dumps({"root_image_id": root.id, "matches": matches})
        db.add(job)
        db.commit()
    except Exception as e:  # noqa: BLE001 (MVP: we surface errors for easier debugging)
        job.status = "failed"
        job.finished_at = _now_utc()
        job.error = str(e)
        db.add(job)
        db.commit()


def run_analysis_job_background(job_id: str) -> None:
    """
    Background-task safe wrapper: opens its own DB session.
    """
    db = SessionLocal()
    try:
        run_analysis_job(db, job_id)
    finally:
        db.close()


def get_latest_job(db: Session, image_id: str) -> Optional[AnalysisJobRow]:
    stmt = (
        select(AnalysisJobRow)
        .where(AnalysisJobRow.image_id == image_id)
        .order_by(AnalysisJobRow.started_at.desc())
        .limit(1)
    )
    return db.execute(stmt).scalars().first()
