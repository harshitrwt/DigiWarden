from __future__ import annotations

from typing import Any, Dict, List, Optional


def build_propagation_dag(
    root_image_id: str,
    candidates: List[Dict[str, Any]],
    root_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Constructs a Directed Acyclic Graph (DAG) for the propagation tree visualization.

    MVP implementation:
    - Root is always `node-0`
    - All discovered candidates are direct children of the root (a star DAG)

    The backend will evolve this into a true lineage builder once we have:
    - more candidate sources (web index)
    - richer mutation classifiers
    - timestamps & parent-selection heuristics
    """
    root_url = root_url or f"/assets/{root_image_id}.png"

    nodes: List[Dict[str, Any]] = [
        {
            "id": "node-0",
            "image_id": root_image_id,
            "label": "Original",
            "url": root_url,
            "authenticity_label": "Original",
            "similarity_score": 100,
            "mutation_type": "None",
        }
    ]
    edges: List[Dict[str, Any]] = []

    # Sort high similarity first for nicer visuals
    ordered = sorted(candidates, key=lambda c: float(c.get("similarity_score", 0.0)), reverse=True)

    for idx, cand in enumerate(ordered, start=1):
        node_id = f"node-{idx}"
        nodes.append(
            {
                "id": node_id,
                "image_id": cand.get("image_id") or cand.get("id") or f"unknown-{idx}",
                "label": cand.get("authenticity_label") or "Candidate",
                "url": cand.get("url") or "",
                "authenticity_label": cand.get("authenticity_label") or "No Match",
                "similarity_score": float(cand.get("similarity_score", 0.0)),
                "mutation_type": cand.get("mutation_type") or "Unknown",
            }
        )
        edges.append(
            {
                "source": "node-0",
                "target": node_id,
                "weight": float(cand.get("similarity_score", 0.0)),
                "label": cand.get("mutation_type") or "Unknown",
            }
        )

    return {"root_id": root_image_id, "nodes": nodes, "edges": edges}
