from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class ImageRow(Base):
    __tablename__ = "images"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    storage_path: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    variant_of: Mapped[Optional[str]] = mapped_column(String, ForeignKey("images.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AnalysisJobRow(Base):
    __tablename__ = "analysis_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    image_id: Mapped[str] = mapped_column(String, ForeignKey("images.id"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)  # processing|complete|failed
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    result_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tree_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    matches_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class DmcaDraftRow(Base):
    __tablename__ = "dmca_drafts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    root_image_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    infringing_node_id: Mapped[str] = mapped_column(String, nullable=False)
    owner_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    owner_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    draft_text: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

