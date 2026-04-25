from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class UploadResponseData(BaseModel):
    image_id: str
    filename: str
    upload_time: datetime


class UploadResponse(BaseModel):
    status: str = "success"
    data: UploadResponseData


class ProcessingResponse(BaseModel):
    status: str = "processing"
    message: str
    job_id: Optional[str] = None


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str


class AnalysisResultData(BaseModel):
    image_id: str
    integrity_score: int
    total_copies_detected: int
    infringing_copies: int
    modified_copies: int


class AnalysisResultResponse(BaseModel):
    status: str = "success"
    data: AnalysisResultData


class TreeNode(BaseModel):
    id: str
    image_id: str
    label: str
    url: str
    authenticity_label: str
    similarity_score: float
    mutation_type: str


class TreeEdge(BaseModel):
    source: str
    target: str
    weight: float
    label: str


class TreeData(BaseModel):
    root_id: str
    nodes: List[TreeNode]
    edges: List[TreeEdge]


class TreeResponse(BaseModel):
    status: str = "success"
    data: TreeData


class ImageMetaData(BaseModel):
    image_id: str
    filename: str
    url: str
    upload_time: datetime
    content_type: Optional[str] = None
    size_bytes: Optional[int] = None
    variant_of: Optional[str] = None


class ImageMetaResponse(BaseModel):
    status: str = "success"
    data: ImageMetaData


class VariantUploadResponseData(BaseModel):
    root_image_id: str
    image_id: str
    filename: str
    url: str
    upload_time: datetime


class VariantUploadResponse(BaseModel):
    status: str = "success"
    data: VariantUploadResponseData


class VariantsListResponse(BaseModel):
    status: str = "success"
    data: List[ImageMetaData]


class JobStatusData(BaseModel):
    image_id: str
    status: str
    job_id: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None


class JobStatusResponse(BaseModel):
    status: str = "success"
    data: JobStatusData


class FingerprintResponseData(BaseModel):
    image_id: str
    phash: str
    orb_descriptor_count: int = Field(ge=0)
    semantic_dim: Optional[int] = Field(default=None, ge=0)


class FingerprintResponse(BaseModel):
    status: str = "success"
    data: FingerprintResponseData


class SimilarityMatch(BaseModel):
    image_id: str
    url: str
    mutation_type: str
    authenticity_label: str
    similarity_score: float
    breakdown: Dict[str, Any]


class SimilarityResponseData(BaseModel):
    root_image_id: str
    matches: List[SimilarityMatch]


class SimilarityResponse(BaseModel):
    status: str = "success"
    data: SimilarityResponseData


class DmcaGenerateRequest(BaseModel):
    infringing_node_id: str
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    root_image_id: Optional[str] = None


class DmcaGenerateResponseData(BaseModel):
    dmca_id: str
    draft_text: str
    evidence: Optional[Dict[str, Any]] = None


class DmcaGenerateResponse(BaseModel):
    status: str = "success"
    data: DmcaGenerateResponseData


class DmcaFetchResponseData(BaseModel):
    dmca_id: str
    draft_text: str
    created_at: datetime


class DmcaFetchResponse(BaseModel):
    status: str = "success"
    data: DmcaFetchResponseData


class ExplainNodeRequest(BaseModel):
    node_id: str


class ExplainNodeResponseData(BaseModel):
    image_id: str
    node_id: str
    explanation: str


class ExplainNodeResponse(BaseModel):
    status: str = "success"
    data: ExplainNodeResponseData
