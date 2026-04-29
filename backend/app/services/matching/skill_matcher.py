from collections import defaultdict

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.entities import CandidateSkill, Job, JobSkill
from app.services.vector_store.embedding import get_embedding_service
from app.services.vector_store.qdrant_store import QdrantSkillStore


class SkillMatcherService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.embedding_service = get_embedding_service(self.settings.embedding_model_name)
        self.skill_store = QdrantSkillStore()

    def index_job_skills(self, job_id: int, normalized_skills: list[str]) -> None:
        unique_skills = sorted(set(skill for skill in normalized_skills if skill))
        if not unique_skills:
            return
        vectors = self.embedding_service.encode(unique_skills)
        self.skill_store.ensure_collection(vector_size=len(vectors[0]))
        self.skill_store.upsert_job_skills(job_id=job_id, skills=unique_skills, vectors=vectors)

    def match_jobs_for_candidate(self, db: Session, user_id: int) -> list[dict]:
        candidate_skills = [
            skill.normalized_skill
            for skill in db.query(CandidateSkill).filter(CandidateSkill.user_id == user_id).all()
            if skill.normalized_skill
        ]
        candidate_skills = sorted(set(candidate_skills))
        if not candidate_skills:
            return []

        vectors = self.embedding_service.encode(candidate_skills)
        if not vectors:
            return []
        self.skill_store.ensure_collection(vector_size=len(vectors[0]))

        candidate_skill_set = set(candidate_skills)
        shortlisted_job_ids: set[int] = set()
        semantic_hits_by_job: dict[int, set[str]] = defaultdict(set)
        for candidate_skill, vector in zip(candidate_skills, vectors, strict=True):
            points = self.skill_store.search_jobs_by_skill(
                vector=vector,
                top_k=self.settings.matching_top_k,
                score_threshold=self.settings.matching_score_threshold,
            )
            for point in points:
                payload = point.payload or {}
                job_id = payload.get("job_id")
                required_skill = payload.get("skill_name")
                if isinstance(job_id, int) and isinstance(required_skill, str):
                    shortlisted_job_ids.add(job_id)
                    semantic_hits_by_job[job_id].add(required_skill)
                    if required_skill == candidate_skill:
                        semantic_hits_by_job[job_id].add(candidate_skill)

        ranked: list[dict] = []
        for job_id in shortlisted_job_ids:
            required = {
                item.normalized_skill
                for item in db.query(JobSkill).filter(JobSkill.job_id == job_id).all()
                if item.normalized_skill
            }
            if not required:
                continue
            # Final match score is strict overlap against extracted skills.
            matched_required = sorted(required.intersection(candidate_skill_set))
            missing = sorted(required.difference(matched_required))
            match_percentage = round((len(matched_required) / len(required)) * 100, 2)

            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                continue
            ranked.append(
                {
                    "job_id": job.id,
                    "title": job.title,
                    "location": job.location,
                    "salary": job.salary,
                    "recruiter_email": job.recruiter_email,
                    "match_percentage": match_percentage,
                    "matched_skills": matched_required,
                    "missing_skills": missing,
                }
            )

        ranked.sort(key=lambda item: item["match_percentage"], reverse=True)
        return ranked
