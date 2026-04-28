from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.entities import Job, JobSkill, Recruiter, User, UserRole
from app.schemas.jobs import JobCreate

router = APIRouter(prefix="/jobs", tags=["jobs"])


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
    for skill in payload.required_skills:
        normalized = skill.strip().lower()
        if not normalized:
            continue
        db.add(JobSkill(job_id=job.id, skill_name=skill.strip(), normalized_skill=normalized))
    db.commit()
    db.refresh(job)
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
