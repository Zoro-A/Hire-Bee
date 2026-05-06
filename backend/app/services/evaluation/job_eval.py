import math
from collections import defaultdict

import numpy as np
from sqlalchemy.orm import Session, joinedload

from app.models.entities import (
    Application,
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

    outputs: list[tuple[ClusterMethod, np.ndarray, np.ndarray]] = []
    km_labels, km_centroids = _kmeans(vectors, k=k)
    outputs.append((ClusterMethod.EMBEDDING_DISTANCE, km_labels, km_centroids))

    cos_labels, cos_centroids = _spherical_kmeans(norm, k=k)
    outputs.append((ClusterMethod.COSINE_SIMILARITY, cos_labels, cos_centroids))

    candidates = db.query(User).filter(User.role == UserRole.JOB_SEEKER).all()
    all_apps = db.query(Application).all()
    app_by_user: dict[int, set[int]] = defaultdict(set)
    for app in all_apps:
        app_by_user[app.user_id].add(app.job_id)

    created_runs: list[JobClusterRun] = []
    for method, labels, centroids in outputs:
        run = JobClusterRun(
            method=method,
            k=int(np.max(labels)) + 1,
            total_jobs=len(jobs),
            silhouette_score=None,
            intra_cluster_distance=None,
            avg_cosine_similarity=float(np.mean(norm @ norm.T)),
            metrics_json={"top_k": top_k, "cosine_threshold": cosine_threshold, "mode": "spherical_kmeans"},
        )
        db.add(run)
        db.flush()

        for i, job in enumerate(jobs):
            label = int(labels[i])
            centroid = centroids[label]
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
            recommended = [jobs[i].id for i in np.argsort(labels)[:top_k]]
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
