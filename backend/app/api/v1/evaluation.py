from sqlalchemy import func
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import require_roles
from app.core.config import get_settings
from app.db.database import get_db
from app.models.entities import (
    CVQualityEvaluation,
    ClusterMethod,
    GeneratedCV,
    Job,
    JobClusterAssignment,
    JobClusterRun,
    JobRecommendationEvaluation,
    User,
    UserRole,
)
from app.schemas.evaluation import (
    CVEvaluationRequest,
    CVEvaluationResponse,
    CVJudgeScores,
    JobClusterPoint,
    JobEvaluationLatestResponse,
    JobEvaluationMetric,
    JobEvaluationRunRequest,
)
from app.services.evaluation.cv_quality import evaluate_cv_with_gemini
from app.services.evaluation.job_eval import run_job_evaluation
from app.services.matching.skill_matcher import SkillMatcherService

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.post("/jobs/run", response_model=list[JobEvaluationMetric])
def run_job_eval(
    payload: JobEvaluationRunRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> list[JobEvaluationMetric]:
    settings = get_settings()
    runs = run_job_evaluation(
        db=db,
        model_name=settings.embedding_model_name,
        k=payload.k,
        top_k=payload.top_k,
        cosine_threshold=payload.cosine_threshold,
    )
    out: list[JobEvaluationMetric] = []
    for run in runs:
        agg = (
            db.query(
                func.avg(JobRecommendationEvaluation.precision_at_k),
                func.avg(JobRecommendationEvaluation.recall_at_k),
                func.avg(JobRecommendationEvaluation.ndcg_at_k),
                func.avg(JobRecommendationEvaluation.mrr),
                func.count(JobRecommendationEvaluation.id),
            )
            .filter(JobRecommendationEvaluation.run_id == run.id)
            .first()
        )
        out.append(
            JobEvaluationMetric(
                method=run.method,
                run_id=run.id,
                total_jobs=run.total_jobs,
                total_candidates=int(agg[4] or 0),
                precision_at_k=float(agg[0] or 0.0),
                recall_at_k=float(agg[1] or 0.0),
                ndcg_at_k=float(agg[2] or 0.0),
                mrr=float(agg[3] or 0.0),
                silhouette_score=run.silhouette_score,
                avg_cosine_similarity=run.avg_cosine_similarity,
                created_at=run.created_at,
            )
        )
    return out


@router.get("/jobs/latest", response_model=JobEvaluationLatestResponse)
def latest_job_eval(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> JobEvaluationLatestResponse:
    runs = (
        db.query(JobClusterRun)
        .order_by(JobClusterRun.created_at.desc())
        .limit(2)
        .all()
    )
    if not runs:
        return JobEvaluationLatestResponse(metrics=[], points=[])
    run_ids = [r.id for r in runs]
    agg_rows = (
        db.query(
            JobRecommendationEvaluation.run_id,
            func.avg(JobRecommendationEvaluation.precision_at_k),
            func.avg(JobRecommendationEvaluation.recall_at_k),
            func.avg(JobRecommendationEvaluation.ndcg_at_k),
            func.avg(JobRecommendationEvaluation.mrr),
            func.count(JobRecommendationEvaluation.id),
        )
        .filter(JobRecommendationEvaluation.run_id.in_(run_ids))
        .group_by(JobRecommendationEvaluation.run_id)
        .all()
    )
    agg_by_run = {r[0]: r for r in agg_rows}
    metrics: list[JobEvaluationMetric] = []
    for run in runs:
        agg = agg_by_run.get(run.id, (run.id, 0, 0, 0, 0, 0))
        metrics.append(
            JobEvaluationMetric(
                method=run.method,
                run_id=run.id,
                total_jobs=run.total_jobs,
                total_candidates=int(agg[5] or 0),
                precision_at_k=float(agg[1] or 0.0),
                recall_at_k=float(agg[2] or 0.0),
                ndcg_at_k=float(agg[3] or 0.0),
                mrr=float(agg[4] or 0.0),
                silhouette_score=run.silhouette_score,
                avg_cosine_similarity=run.avg_cosine_similarity,
                created_at=run.created_at,
            )
        )
    points_rows = (
        db.query(JobClusterAssignment, Job)
        .join(Job, Job.id == JobClusterAssignment.job_id)
        .filter(JobClusterAssignment.run_id == runs[0].id)
        .all()
    )
    points = [
        JobClusterPoint(
            run_id=runs[0].id,
            method=runs[0].method,
            job_id=job.id,
            title=job.title,
            cluster_label=assign.cluster_label,
            distance_to_centroid=assign.distance_to_centroid,
            cosine_to_centroid=assign.cosine_to_centroid,
        )
        for assign, job in points_rows
    ]
    return JobEvaluationLatestResponse(metrics=metrics, points=points)


@router.get("/jobs/for-me", response_model=JobEvaluationLatestResponse)
def seeker_job_eval_view(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> JobEvaluationLatestResponse:
    runs = db.query(JobClusterRun).order_by(JobClusterRun.created_at.desc()).limit(2).all()
    if not runs:
        return JobEvaluationLatestResponse(metrics=[], points=[])

    agg_rows = (
        db.query(
            JobRecommendationEvaluation.run_id,
            func.avg(JobRecommendationEvaluation.precision_at_k),
            func.avg(JobRecommendationEvaluation.recall_at_k),
            func.avg(JobRecommendationEvaluation.ndcg_at_k),
            func.avg(JobRecommendationEvaluation.mrr),
            func.count(JobRecommendationEvaluation.id),
        )
        .filter(
            JobRecommendationEvaluation.run_id.in_([r.id for r in runs]),
            JobRecommendationEvaluation.candidate_user_id == current_user.id,
        )
        .group_by(JobRecommendationEvaluation.run_id)
        .all()
    )
    agg_by_run = {r[0]: r for r in agg_rows}
    metrics: list[JobEvaluationMetric] = []
    for run in runs:
        agg = agg_by_run.get(run.id, (run.id, 0, 0, 0, 0, 0))
        metrics.append(
            JobEvaluationMetric(
                method=run.method,
                run_id=run.id,
                total_jobs=run.total_jobs,
                total_candidates=1 if agg[5] else 0,
                precision_at_k=float(agg[1] or 0.0),
                recall_at_k=float(agg[2] or 0.0),
                ndcg_at_k=float(agg[3] or 0.0),
                mrr=float(agg[4] or 0.0),
                silhouette_score=run.silhouette_score,
                avg_cosine_similarity=run.avg_cosine_similarity,
                created_at=run.created_at,
            )
        )

    latest_run = runs[0]
    points_rows = (
        db.query(JobClusterAssignment, Job)
        .join(Job, Job.id == JobClusterAssignment.job_id)
        .filter(JobClusterAssignment.run_id == latest_run.id)
        .all()
    )
    if not points_rows:
        return JobEvaluationLatestResponse(metrics=metrics, points=[])

    match_rows = SkillMatcherService().match_jobs_for_candidate(db, current_user.id)
    by_job = {int(r["job_id"]): r for r in match_rows if "job_id" in r}

    points: list[JobClusterPoint] = []
    for run in runs:
        run_points = (
            db.query(JobClusterAssignment, Job)
            .join(Job, Job.id == JobClusterAssignment.job_id)
            .filter(JobClusterAssignment.run_id == run.id)
            .all()
        )
        if not run_points:
            continue
        for i, (assign, job) in enumerate(run_points):
            semantic = by_job.get(int(job.id), {}).get("semantic_relevance_score")
            exact = by_job.get(int(job.id), {}).get("exact_match_percentage")
            literal = by_job.get(int(job.id), {}).get("literal_feasibility_score")
            if run.method == ClusterMethod.COSINE_SIMILARITY:
                base_score = float(semantic) if semantic is not None else float(exact or 0.0)
            else:
                # Non-cosine comparison: literal feasibility from concrete skill overlap.
                base_score = float(literal) if literal is not None else float(exact or 0.0)
            cos_candidate = base_score / 100.0
            dist_candidate = max(0.0, 1.0 - cos_candidate)
            points.append(
                JobClusterPoint(
                    run_id=run.id,
                    method=run.method,
                    job_id=job.id,
                    title=job.title,
                    cluster_label=assign.cluster_label,
                    distance_to_centroid=assign.distance_to_centroid,
                    cosine_to_centroid=assign.cosine_to_centroid,
                    candidate_cosine=cos_candidate,
                    candidate_distance=dist_candidate,
                    x=0.0,
                    y=0.0,
                    is_candidate=False,
                )
            )
        points.append(
            JobClusterPoint(
                run_id=run.id,
                method=run.method,
                job_id=0,
                title="Your skill vector",
                cluster_label=-1,
                distance_to_centroid=None,
                cosine_to_centroid=None,
                candidate_cosine=1.0,
                candidate_distance=0.0,
                x=0.0,
                y=0.0,
                is_candidate=True,
            )
        )
    return JobEvaluationLatestResponse(metrics=metrics, points=points)


def _store_cv_evaluation(
    db: Session, cv: GeneratedCV, user_id: int, transcript: list[dict], result: dict, model_name: str
) -> CVQualityEvaluation:
    row = CVQualityEvaluation(
        cv_id=cv.id,
        user_id=user_id,
        evaluator="gemini",
        model_name=model_name,
        overall_score=float(result.get("overall", 0.0)),
        faithfulness_score=float(result.get("faithfulness", 0.0)),
        relevance_score=float(result.get("relevance", 0.0)),
        professionalism_score=float(result.get("professionalism", 0.0)),
        completeness_score=float(result.get("completeness", 0.0)),
        impact_score=float(result.get("impact", 0.0)),
        strengths=list(result.get("strengths", [])),
        weaknesses=list(result.get("weaknesses", [])),
        recommendations=list(result.get("recommendations", [])),
        transcript_json=transcript,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.post("/cv/score", response_model=CVEvaluationResponse)
def score_cv(
    payload: CVEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> CVEvaluationResponse:
    cv = db.query(GeneratedCV).filter(GeneratedCV.id == payload.cv_id, GeneratedCV.user_id == current_user.id).first()
    if not cv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found")
    result, model_name = evaluate_cv_with_gemini(
        messages=[m.model_dump() for m in payload.messages],
        cv_json=cv.cv_json,
    )
    row = _store_cv_evaluation(
        db=db,
        cv=cv,
        user_id=current_user.id,
        transcript=[m.model_dump() for m in payload.messages],
        result=result,
        model_name=model_name,
    )
    return CVEvaluationResponse(
        cv_id=cv.id,
        model_name=row.model_name,
        evaluator=row.evaluator,
        created_at=row.created_at,
        scores=CVJudgeScores(
            overall=row.overall_score,
            faithfulness=row.faithfulness_score,
            relevance=row.relevance_score,
            professionalism=row.professionalism_score,
            completeness=row.completeness_score,
            impact=row.impact_score,
            strengths=row.strengths or [],
            weaknesses=row.weaknesses or [],
            recommendations=row.recommendations or [],
        ),
    )


@router.get("/cv/latest/{cv_id}", response_model=CVEvaluationResponse)
def latest_cv_score(
    cv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER, UserRole.RECRUITER, UserRole.ADMIN)),
) -> CVEvaluationResponse:
    row = db.query(CVQualityEvaluation).filter(CVQualityEvaluation.cv_id == cv_id).order_by(CVQualityEvaluation.created_at.desc()).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV evaluation not found")
    if current_user.role == UserRole.JOB_SEEKER and row.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    return CVEvaluationResponse(
        cv_id=row.cv_id,
        model_name=row.model_name,
        evaluator=row.evaluator,
        created_at=row.created_at,
        scores=CVJudgeScores(
            overall=row.overall_score,
            faithfulness=row.faithfulness_score,
            relevance=row.relevance_score,
            professionalism=row.professionalism_score,
            completeness=row.completeness_score,
            impact=row.impact_score,
            strengths=row.strengths or [],
            weaknesses=row.weaknesses or [],
            recommendations=row.recommendations or [],
        ),
    )
