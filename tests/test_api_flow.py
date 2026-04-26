from __future__ import annotations

import importlib
import sys
from pathlib import Path

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ORIGINAL_FIXTURE = PROJECT_ROOT / "tests" / "fixtures" / "original.png"
MODIFIED_FIXTURE = PROJECT_ROOT / "tests" / "fixtures" / "modified.png"


def _build_client(monkeypatch, tmp_path: Path) -> TestClient:
    storage_root = tmp_path / "storage"
    db_path = storage_root / "contentgenome.db"

    monkeypatch.setenv("STORAGE_PATH", str(storage_root))
    monkeypatch.setenv("DB_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("ENABLE_DEMO_VARIANTS", "false")

    for module_name in list(sys.modules):
        if module_name == "backend" or module_name.startswith("backend.app"):
            sys.modules.pop(module_name, None)

    app_module = importlib.import_module("backend.app.main")
    client = TestClient(app_module.app)
    client.__enter__()
    return client


def _upload(client: TestClient, path: Path, endpoint: str) -> dict:
    with path.open("rb") as handle:
        response = client.post(endpoint, files={"file": (path.name, handle, "image/png")})
    assert response.status_code == 200, response.text
    return response.json()["data"]


def test_root_only_analysis_returns_a_single_root_node(monkeypatch, tmp_path):
    client = _build_client(monkeypatch, tmp_path)
    try:
        upload_data = _upload(client, ORIGINAL_FIXTURE, "/api/upload")
        image_id = upload_data["image_id"]

        analyze_response = client.post(f"/api/analyze/{image_id}")
        assert analyze_response.status_code == 202, analyze_response.text

        status_response = client.get(f"/api/images/{image_id}/status")
        assert status_response.status_code == 200, status_response.text
        assert status_response.json()["data"]["status"] == "complete"

        result_response = client.get(f"/api/analyze/{image_id}/result")
        assert result_response.status_code == 200, result_response.text
        assert result_response.json()["data"]["total_copies_detected"] == 0

        tree_response = client.get(f"/api/tree/{image_id}")
        assert tree_response.status_code == 200, tree_response.text
        tree_data = tree_response.json()["data"]
        assert len(tree_data["nodes"]) == 1
        assert tree_data["nodes"][0]["authenticity_label"] == "Original"
    finally:
        client.__exit__(None, None, None)


def test_upload_analyze_tree_and_dmca_flow(monkeypatch, tmp_path):
    client = _build_client(monkeypatch, tmp_path)
    try:
        root_upload = _upload(client, ORIGINAL_FIXTURE, "/api/upload")
        root_image_id = root_upload["image_id"]

        _upload(client, MODIFIED_FIXTURE, f"/api/images/{root_image_id}/variants")

        analyze_response = client.post(f"/api/analyze/{root_image_id}")
        assert analyze_response.status_code == 202, analyze_response.text

        status_response = client.get(f"/api/images/{root_image_id}/status")
        assert status_response.status_code == 200, status_response.text
        assert status_response.json()["data"]["status"] == "complete"

        similarity_response = client.get(f"/api/similarity/{root_image_id}")
        assert similarity_response.status_code == 200, similarity_response.text
        similarity_data = similarity_response.json()["data"]
        assert similarity_data["matches"]

        tree_response = client.get(f"/api/tree/{root_image_id}")
        assert tree_response.status_code == 200, tree_response.text
        tree_data = tree_response.json()["data"]
        assert len(tree_data["nodes"]) >= 2

        first_variant_node = next(node for node in tree_data["nodes"] if node["id"] != "node-0")
        dmca_response = client.post(
            "/api/dmca/generate",
            json={
                "root_image_id": root_image_id,
                "infringing_node_id": first_variant_node["id"],
                "owner_name": "Test Owner",
                "owner_email": "owner@example.com",
            },
        )
        assert dmca_response.status_code == 200, dmca_response.text
        dmca_data = dmca_response.json()["data"]
        assert "17 U.S.C. 512(c)" in dmca_data["draft_text"]
        assert root_image_id in dmca_data["draft_text"]
    finally:
        client.__exit__(None, None, None)
