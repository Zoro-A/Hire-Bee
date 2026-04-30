from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.entities import CoverLetter, Job, Resume, User, UserRole
from app.schemas.cover_letter import CoverLetterGenerateRequest, CoverLetterResponse
from app.services.cover_letter.generator import CoverLetterGenerator

router = APIRouter(prefix="/cover-letters", tags=["cover-letters"])
generator = CoverLetterGenerator()


@router.post("/generate", response_model=CoverLetterResponse, status_code=status.HTTP_201_CREATED)
def generate_cover_letter(
    payload: CoverLetterGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> CoverLetter:
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    latest_resume = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .first()
    )
    resume_data = latest_resume.parsed_data if latest_resume else {}
    job_data = {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "location": job.location,
        "company_name": "Hiring Team",
    }
    profile = {"full_name": current_user.full_name, "email": current_user.email}
    content, model_name = generator.generate(profile, resume_data, job_data, tone=payload.tone)

    letter = CoverLetter(user_id=current_user.id, job_id=job.id, content=content, model_name=model_name)
    db.add(letter)
    db.commit()
    db.refresh(letter)
    return letter


@router.get("", response_model=list[CoverLetterResponse])
def list_cover_letters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> list[CoverLetter]:
    return (
        db.query(CoverLetter)
        .filter(CoverLetter.user_id == current_user.id)
        .order_by(CoverLetter.created_at.desc())
        .all()
    )
