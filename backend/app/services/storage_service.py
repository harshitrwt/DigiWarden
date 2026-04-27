from __future__ import annotations

import os
from pathlib import Path
from typing import Optional, Tuple

from fastapi import UploadFile

from ..settings import get_uploads_path


ALLOWED_IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}


def ensure_storage_dirs() -> None:
    uploads_dir = get_uploads_path()
    uploads_dir.mkdir(parents=True, exist_ok=True)


def _safe_suffix(filename: str, content_type: Optional[str]) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix in ALLOWED_IMAGE_SUFFIXES:
        return suffix
    if content_type:
        if content_type == "image/jpeg":
            return ".jpg"
        if content_type == "image/png":
            return ".png"
        if content_type == "image/webp":
            return ".webp"
    return ".png"


def save_upload_to_disk(upload: UploadFile, image_id: str) -> Tuple[str, int]:
    """
    Saves an uploaded image to local storage.

    Returns: (storage_path_relative_to_storage_root, size_bytes)
    """
    ensure_storage_dirs()
    suffix = _safe_suffix(upload.filename or "upload.png", upload.content_type)
    filename_on_disk = f"{image_id}{suffix}"
    uploads_dir = get_uploads_path()
    dst = uploads_dir / filename_on_disk

    upload.file.seek(0, os.SEEK_SET)
    size = 0
    with dst.open("wb") as f:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            f.write(chunk)

    rel_path = str(Path("uploads") / filename_on_disk)
    return rel_path, size


def save_bytes_to_uploads(content: bytes, image_id: str, suffix: str = ".png") -> str:
    ensure_storage_dirs()
    if not suffix.startswith("."):
        suffix = f".{suffix}"
    filename_on_disk = f"{image_id}{suffix}"
    dst = get_uploads_path() / filename_on_disk
    dst.write_bytes(content)
    return str(Path("uploads") / filename_on_disk)
