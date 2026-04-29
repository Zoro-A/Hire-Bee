from uuid import NAMESPACE_DNS, uuid5

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from app.core.config import get_settings


class QdrantSkillStore:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = QdrantClient(
            url=self.settings.qdrant_url,
            api_key=self.settings.qdrant_api_key,
            timeout=10,
        )
        self.collection_name = self.settings.qdrant_collection_name

    def ensure_collection(self, vector_size: int | None = None) -> None:
        target_vector_size = vector_size or self.settings.embedding_vector_size
        collections = self.client.get_collections().collections
        exists = any(collection.name == self.collection_name for collection in collections)
        if exists:
            return
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=qmodels.VectorParams(size=target_vector_size, distance=qmodels.Distance.COSINE),
        )

    def upsert_job_skills(self, job_id: int, skills: list[str], vectors: list[list[float]]) -> None:
        if not skills:
            return
        if not self.settings.qdrant_safe_upsert:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter(
                        must=[qmodels.FieldCondition(key="job_id", match=qmodels.MatchValue(value=job_id))]
                    )
                ),
            )
        points = [
            qmodels.PointStruct(
                id=self._point_id(job_id=job_id, skill_name=skill),
                vector=vector,
                payload={"job_id": job_id, "skill_name": skill},
            )
            for skill, vector in zip(skills, vectors, strict=True)
        ]
        self.client.upsert(collection_name=self.collection_name, points=points)

    @staticmethod
    def _point_id(job_id: int, skill_name: str) -> str:
        # Deterministic ID prevents duplicates across re-index runs.
        return str(uuid5(NAMESPACE_DNS, f"hirebee:{job_id}:{skill_name.lower()}"))

    def search_jobs_by_skill(self, vector: list[float], top_k: int, score_threshold: float) -> list[qmodels.ScoredPoint]:
        return self.client.search(
            collection_name=self.collection_name,
            query_vector=vector,
            limit=top_k,
            score_threshold=score_threshold,
        )
