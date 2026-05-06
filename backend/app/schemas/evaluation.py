from datetime import datetime

from pydantic import BaseModel, Field

from app.models.entities import ClusterMethod
from app.schemas.cv import TranscriptMessage


class JobEvaluationRunRequest(BaseModel):
    k: int = Field(default=4, ge=2, le=12)
    top_k: int = Field(default=5, ge=1, le=20)
    cosine_threshold: float = Field(default=0.75, ge=0.3, le=0.99)


class JobEvaluationMetric(BaseModel):
    method: ClusterMethod
    run_id: int
    total_jobs: int
    total_candidates: int
    precision_at_k: float
    recall_at_k: float
    ndcg_at_k: float
    mrr: float
    silhouette_score: float | None = None
    avg_cosine_similarity: float | None = None
    created_at: datetime


class JobClusterPoint(BaseModel):
    run_id: int
    method: ClusterMethod
    job_id: int
    title: str
    cluster_label: int
    distance_to_centroid: float | None = None
    cosine_to_centroid: float | None = None
    candidate_cosine: float | None = None
    candidate_distance: float | None = None
    x: float | None = None
    y: float | None = None
    is_candidate: bool = False


class JobEvaluationLatestResponse(BaseModel):
    metrics: list[JobEvaluationMetric]
    points: list[JobClusterPoint]


class CVJudgeScores(BaseModel):
    overall: float = Field(ge=0, le=100)
    faithfulness: float = Field(ge=0, le=100)
    relevance: float = Field(ge=0, le=100)
    professionalism: float = Field(ge=0, le=100)
    completeness: float = Field(ge=0, le=100)
    impact: float = Field(ge=0, le=100)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class CVEvaluationRequest(BaseModel):
    cv_id: int
    messages: list[TranscriptMessage]


class CVEvaluationResponse(BaseModel):
    cv_id: int
    model_name: str
    evaluator: str
    created_at: datetime
    scores: CVJudgeScores
