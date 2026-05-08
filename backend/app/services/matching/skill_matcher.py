from collections import defaultdict
from difflib import SequenceMatcher

from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.models.entities import CandidateSkill, Job
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

        candidate_skill_set = set(candidate_skills)
        semantic_scores_by_job: dict[int, list[float]] = defaultdict(list)
        semantic_search_available = False

        try:
            vectors = self.embedding_service.encode(candidate_skills)
            if vectors:
                self.skill_store.ensure_collection(vector_size=len(vectors[0]))
                semantic_search_available = True
                for candidate_skill, vector in zip(candidate_skills, vectors, strict=True):
                    points = self.skill_store.search_jobs_by_skill(
                        vector=vector,
                        top_k=self.settings.matching_top_k,
                        score_threshold=self.settings.matching_score_threshold,
                    )
                    for point in points:
                        payload = point.payload or {}
                        job_id = payload.get("job_id")
                        if isinstance(job_id, int):
                            semantic_scores_by_job[job_id].append(float(point.score))
        except Exception:
            # Skill overlap still works without vector search (e.g. Qdrant down).
            pass

        jobs = db.query(Job).options(joinedload(Job.skills)).order_by(Job.id).all()
        ranked: list[dict] = []
        for job in jobs:
            required = {s.normalized_skill for s in job.skills if s.normalized_skill}
            if not required:
                continue

            matched_required = sorted(required.intersection(candidate_skill_set))
            missing = sorted(required.difference(matched_required))
            exact_match_percentage = round((len(matched_required) / len(required)) * 100, 2)
            # Literal (non-embedding) feasibility:
            # For each required skill, take the best lexical/token-level match against candidate skills.
            # This keeps the metric interpretable while avoiding harsh penalties from strict exact-only overlap.
            lexical_cover_scores: list[float] = []
            for req in sorted(required):
                best = 0.0
                for cand in candidate_skills:
                    ratio = SequenceMatcher(None, cand, req).ratio()
                    if cand in req or req in cand:
                        ratio = max(ratio, 0.78)
                    best = max(best, ratio)
                lexical_cover_scores.append(best)
            lexical_coverage_percentage = round(
                (sum(lexical_cover_scores) / len(lexical_cover_scores) * 100.0) if lexical_cover_scores else 0.0,
                2,
            )
            literal_feasibility_score = round(
                min(100.0, 0.65 * lexical_coverage_percentage + 0.35 * exact_match_percentage),
                2,
            )

            scores = semantic_scores_by_job.get(job.id, [])
            # If vector hits are empty (too strict threshold / sparse vectors),
            # backfill with lexical semantics so cosine-style signal does not collapse to zero.
            if not scores:
                per_skill_best: list[float] = []
                required_list = sorted(required)
                for c in candidate_skills:
                    best = 0.0
                    for r in required_list:
                        # Token-aware lexical proximity to approximate semantic relatedness offline.
                        ratio = SequenceMatcher(None, c, r).ratio()
                        if c in r or r in c:
                            ratio = max(ratio, 0.72)
                        best = max(best, ratio)
                    per_skill_best.append(best)
                if per_skill_best:
                    fallback_sem = sum(per_skill_best) / len(per_skill_best)
                    scores = [fallback_sem]
            # Qdrant cosine-style scores are typically in [0, 1]; scale for display blend.
            semantic_raw = (sum(scores) / len(scores)) if scores else 0.0
            semantic_relevance_score = round(min(100.0, semantic_raw * 100.0), 2)

            if scores and semantic_relevance_score > 0:
                if exact_match_percentage > 0:
                    # Blend strict overlap with semantic similarity.
                    match_percentage = min(
                        100.0,
                        round(0.58 * exact_match_percentage + 0.42 * semantic_relevance_score, 1),
                    )
                else:
                    # No exact token overlap but embeddings suggest related stacks (still capped below strong exact matches).
                    match_percentage = min(82.0, round(semantic_relevance_score * 0.68, 1))
            else:
                match_percentage = float(exact_match_percentage)

            ranked.append(
                {
                    "job_id": job.id,
                    "title": job.title,
                    "location": job.location,
                    "salary": job.salary,
                    "recruiter_email": job.recruiter_email,
                    "match_percentage": match_percentage,
                    "exact_match_percentage": exact_match_percentage,
                    "literal_feasibility_score": literal_feasibility_score,
                    "semantic_relevance_score": semantic_relevance_score,
                    "matched_skills": matched_required,
                    "missing_skills": missing,
                }
            )

        ranked.sort(key=lambda item: (-item["match_percentage"], item["job_id"]))
        return ranked
