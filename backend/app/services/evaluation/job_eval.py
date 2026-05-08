import math
from collections import defaultdict

import numpy as np
from sqlalchemy.orm import Session, joinedload

from app.models.entities import (
    Application,
    CandidateSkill,
    ClusterMethod,
    Job,
    JobClusterAssignment,
    JobClusterRun,
    JobRecommendationEvaluation,
    User,
    UserRole,
)
from app.services.vector_store.embedding import get_embedding_service


def _job_text(job: Job) -> str:
    skills = ", ".join(sorted({s.normalized_skill for s in job.skills if s.normalized_skill}))
    return f"{job.title}\n{job.description}\n{job.location or ''}\n{skills}".strip()


def _normalize_rows(x: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(x, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return x / norms


def _kmeans(x: np.ndarray, k: int, iters: int = 20) -> tuple[np.ndarray, np.ndarray]:
    n = x.shape[0]
    idx = np.linspace(0, n - 1, num=k, dtype=int)
    centroids = x[idx].copy()
    labels = np.zeros(n, dtype=int)
    for _ in range(iters):
        dists = np.linalg.norm(x[:, None, :] - centroids[None, :, :], axis=2)
        next_labels = np.argmin(dists, axis=1)
        if np.array_equal(labels, next_labels):
            break
        labels = next_labels
        for ci in range(k):
            members = x[labels == ci]
            if len(members) > 0:
                centroids[ci] = members.mean(axis=0)
    return labels, centroids


def _spherical_kmeans(x_norm: np.ndarray, k: int, iters: int = 25) -> tuple[np.ndarray, np.ndarray]:
    n = x_norm.shape[0]
    idx = np.linspace(0, n - 1, num=k, dtype=int)
    centroids = x_norm[idx].copy()
    labels = np.zeros(n, dtype=int)
    for _ in range(iters):
        sim = x_norm @ centroids.T
        next_labels = np.argmax(sim, axis=1)
        if np.array_equal(labels, next_labels):
            break
        labels = next_labels
        for ci in range(k):
            members = x_norm[labels == ci]
            if len(members) > 0:
                c = members.mean(axis=0)
                c_norm = np.linalg.norm(c)
                centroids[ci] = c / (c_norm if c_norm > 0 else 1.0)
    return labels, centroids


def _dcg(rels: list[int], k: int) -> float:
    total = 0.0
    for i, rel in enumerate(rels[:k], start=1):
        total += rel / math.log2(i + 1)
    return total


def run_job_evaluation(db: Session, model_name: str, k: int, top_k: int, cosine_threshold: float) -> list[JobClusterRun]:
    jobs = db.query(Job).options(joinedload(Job.skills)).order_by(Job.id).all()
    if len(jobs) < 2:
        return []
    k = max(2, min(k, len(jobs)))
    embedder = get_embedding_service(model_name)
    vectors = np.array(embedder.encode([_job_text(j) for j in jobs]), dtype=float)
    norm = _normalize_rows(vectors)

    outputs: list[tuple[ClusterMethod, np.ndarray, np.ndarray, str]] = []
    # Second method is explicitly non-cosine semantic: literal skill-overlap space.
    vocab = sorted({s.normalized_skill for j in jobs for s in j.skills if s.normalized_skill})
    skill_index = {s: i for i, s in enumerate(vocab)}
    skill_matrix = np.zeros((len(jobs), max(1, len(vocab))), dtype=float)
    for ji, job in enumerate(jobs):
        for s in {x.normalized_skill for x in job.skills if x.normalized_skill}:
            skill_matrix[ji, skill_index[s]] = 1.0
    overlap_labels, overlap_centroids = _kmeans(skill_matrix, k=k)
    outputs.append((ClusterMethod.EMBEDDING_DISTANCE, overlap_labels, overlap_centroids, "skill_overlap"))

    cos_labels, cos_centroids = _spherical_kmeans(norm, k=k)
    outputs.append((ClusterMethod.COSINE_SIMILARITY, cos_labels, cos_centroids, "cosine_spherical"))

    candidates = db.query(User).filter(User.role == UserRole.JOB_SEEKER).all()
    all_apps = db.query(Application).all()
    app_by_user: dict[int, set[int]] = defaultdict(set)
    for app in all_apps:
        app_by_user[app.user_id].add(app.job_id)
    candidate_skill_map: dict[int, set[str]] = {}
    for row in db.query(CandidateSkill).all():
        if row.normalized_skill:
            candidate_skill_map.setdefault(row.user_id, set()).add(row.normalized_skill)

    created_runs: list[JobClusterRun] = []
    for method, labels, centroids, mode in outputs:
        run = JobClusterRun(
            method=method,
            k=int(np.max(labels)) + 1,
            total_jobs=len(jobs),
            silhouette_score=None,
            intra_cluster_distance=None,
            avg_cosine_similarity=float(np.mean(norm @ norm.T)),
            metrics_json={"top_k": top_k, "cosine_threshold": cosine_threshold, "mode": mode},
        )
        db.add(run)
        db.flush()

        for i, job in enumerate(jobs):
            label = int(labels[i])
            centroid = centroids[label]
            if mode == "skill_overlap":
                dist = float(np.linalg.norm(skill_matrix[i] - centroid))
                centroid_norm = np.linalg.norm(centroid) or 1.0
                cos = float(np.dot(skill_matrix[i], centroid) / (np.linalg.norm(skill_matrix[i]) or 1.0) / centroid_norm)
            else:
                dist = float(np.linalg.norm(vectors[i] - centroid))
                cos = float(np.dot(norm[i], _normalize_rows(centroid.reshape(1, -1))[0]))
            db.add(
                JobClusterAssignment(
                    run_id=run.id,
                    job_id=job.id,
                    cluster_label=label,
                    distance_to_centroid=dist,
                    cosine_to_centroid=cos,
                )
            )

        for candidate in candidates:
            relevant = app_by_user.get(candidate.id, set())
            if not relevant:
                continue
            if mode == "skill_overlap":
                cand_skills = candidate_skill_map.get(candidate.id, set())
                scored = []
                for j in jobs:
                    req = {x.normalized_skill for x in j.skills if x.normalized_skill}
                    overlap = (len(req.intersection(cand_skills)) / len(req)) if req else 0.0
                    scored.append((j.id, overlap))
                scored.sort(key=lambda t: (-t[1], t[0]))
                recommended = [jid for jid, _ in scored[:top_k]]
            else:
                candidate_text = ", ".join(sorted(candidate_skill_map.get(candidate.id, set()))) or "generalist"
                cand_vec = np.array(embedder.encode([candidate_text])[0], dtype=float)
                cand_vec = cand_vec / (np.linalg.norm(cand_vec) or 1.0)
                scored = [(jobs[i].id, float(np.dot(norm[i], cand_vec))) for i in range(len(jobs))]
                scored.sort(key=lambda t: (-t[1], t[0]))
                recommended = [jid for jid, _ in scored[:top_k]]
            rels = [1 if rid in relevant else 0 for rid in recommended]
            hits = sum(rels)
            precision = hits / max(1, top_k)
            recall = hits / max(1, len(relevant))
            ideal = sorted(rels, reverse=True)
            ndcg = (_dcg(rels, top_k) / _dcg(ideal, top_k)) if _dcg(ideal, top_k) > 0 else 0.0
            rr = 0.0
            for rank, rel in enumerate(rels, start=1):
                if rel:
                    rr = 1.0 / rank
                    break
            db.add(
                JobRecommendationEvaluation(
                    run_id=run.id,
                    candidate_user_id=candidate.id,
                    top_k=top_k,
                    precision_at_k=precision,
                    recall_at_k=recall,
                    ndcg_at_k=ndcg,
                    mrr=rr,
                )
            )
        created_runs.append(run)

    db.commit()
    for run in created_runs:
        db.refresh(run)
    return created_runs
