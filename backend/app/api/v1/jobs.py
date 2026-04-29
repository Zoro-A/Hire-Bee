from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.entities import Job, JobSkill, Recruiter, User, UserRole
from app.schemas.jobs import JobCreate
from app.services.matching.skill_matcher import SkillMatcherService
from app.services.resume_parser.skills import normalize_skill

router = APIRouter(prefix="/jobs", tags=["jobs"])
matcher_service = SkillMatcherService()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECRUITER)),
) -> dict:
    recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recruiter profile required")

    job = Job(
        recruiter_id=recruiter.id,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        salary=payload.salary,
        recruiter_email=payload.recruiter_email,
    )
    db.add(job)
    db.flush()
    normalized_skills: list[str] = []
    for skill in payload.required_skills:
        normalized = normalize_skill(skill)
        if not normalized:
            continue
        normalized_skills.append(normalized)
        db.add(JobSkill(job_id=job.id, skill_name=skill.strip(), normalized_skill=normalized))
    db.commit()
    db.refresh(job)
    if normalized_skills:
        try:
            matcher_service.index_job_skills(job_id=job.id, normalized_skills=normalized_skills)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Job created but skill indexing failed: {exc}",
            ) from exc
    return {"id": job.id, "title": job.title}


@router.get("")
def list_jobs(db: Session = Depends(get_db)) -> list[dict]:
    jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    return [
        {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "salary": job.salary,
            "recruiter_email": job.recruiter_email,
            "required_skills": [item.normalized_skill for item in job.skills],
        }
        for job in jobs
    ]
