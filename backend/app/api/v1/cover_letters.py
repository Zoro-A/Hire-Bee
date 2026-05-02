from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.entities import CoverLetter, GeneratedCV, Job, Resume, User, UserRole
from app.schemas.cover_letter import CoverLetterGenerateRequest, CoverLetterResponse, CoverLetterUpdateRequest
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

    resume_data: dict = {}
    if payload.generated_cv_id:
        generated_cv = (
            db.query(GeneratedCV)
            .filter(GeneratedCV.id == payload.generated_cv_id, GeneratedCV.user_id == current_user.id)
            .first()
        )
        if not generated_cv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected CV not found")
        resume_data = generated_cv.cv_json or {}
    elif payload.resume_id:
        selected_resume = (
            db.query(Resume)
            .filter(Resume.id == payload.resume_id, Resume.user_id == current_user.id)
            .first()
        )
        if not selected_resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected resume not found")
        resume_data = selected_resume.parsed_data or {}
    else:
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


@router.patch("/{cover_letter_id}", response_model=CoverLetterResponse)
def update_cover_letter(
    cover_letter_id: int,
    payload: CoverLetterUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> CoverLetter:
    letter = (
        db.query(CoverLetter)
        .filter(CoverLetter.id == cover_letter_id, CoverLetter.user_id == current_user.id)
        .first()
    )
    if not letter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cover letter not found")

    letter.content = payload.content
    db.commit()
    db.refresh(letter)
    return letter
