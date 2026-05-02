from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.database import get_db
from app.models.entities import (
    Application,
    ApplicationStatus,
    CoverLetter,
    GeneratedCV,
    Job,
    Recruiter,
    Resume,
    User,
    UserRole,
)
from app.schemas.applications import (
    ApplicationCreateRequest,
    ApplicationResponse,
    ApplicationStatusUpdateRequest,
    RecruiterApplicationView,
)
from app.services.email.smtp_service import SMTPEmailService

router = APIRouter(prefix="/applications", tags=["applications"])
email_service = SMTPEmailService()


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> Application:
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    existing = (
        db.query(Application)
        .filter(Application.user_id == current_user.id, Application.job_id == payload.job_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job.",
        )

    recruiter = db.query(Recruiter).filter(Recruiter.id == job.recruiter_id).first()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recruiter not found for this job")

    resume = None
    if payload.resume_id:
        resume = (
            db.query(Resume)
            .filter(Resume.id == payload.resume_id, Resume.user_id == current_user.id)
            .first()
        )
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    generated_cv = None
    if payload.generated_cv_id:
        generated_cv = (
            db.query(GeneratedCV)
            .filter(GeneratedCV.id == payload.generated_cv_id, GeneratedCV.user_id == current_user.id)
            .first()
        )
        if not generated_cv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generated CV not found")

    cover_letter = None
    if payload.cover_letter_id:
        cover_letter = (
            db.query(CoverLetter)
            .filter(CoverLetter.id == payload.cover_letter_id, CoverLetter.user_id == current_user.id)
            .first()
        )
        if not cover_letter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cover letter not found")

    application = Application(
        user_id=current_user.id,
        job_id=job.id,
        resume_id=payload.resume_id,
        generated_cv_id=payload.generated_cv_id,
        cover_letter_id=payload.cover_letter_id,
        status=ApplicationStatus.APPLIED,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    attachment_paths: list[str] = []
    if resume and resume.file_path:
        attachment_paths.append(resume.file_path)
    if generated_cv and generated_cv.pdf_path:
        attachment_paths.append(generated_cv.pdf_path)
    if generated_cv and generated_cv.docx_path:
        attachment_paths.append(generated_cv.docx_path)

    cover_letter_text = cover_letter.content.strip() if cover_letter and cover_letter.content else "Not provided."
    email_body = (
        f"New application received for '{job.title}'.\n\n"
        f"Candidate: {current_user.full_name} ({current_user.email})\n"
        f"Application ID: {application.id}\n"
        f"Cover Letter:\n{cover_letter_text}"
    )
    email_service.send_email(
        db=db,
        recipient=recruiter.recruiter_email,
        subject=f"New HireBee Application: {job.title}",
        body=email_body,
        attachment_paths=attachment_paths,
    )

    return application


@router.get("/me", response_model=list[ApplicationResponse])
def list_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.JOB_SEEKER)),
) -> list[Application]:
    return (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )


@router.get("/recruiter", response_model=list[RecruiterApplicationView])
def recruiter_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECRUITER)),
) -> list[RecruiterApplicationView]:
    recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found")

    applications = (
        db.query(Application, User, Job)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .filter(Job.recruiter_id == recruiter.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    return [
        RecruiterApplicationView(
            application_id=application.id,
            candidate_name=user.full_name,
            candidate_email=user.email,
            job_id=job.id,
            job_title=job.title,
            status=application.status,
            match_percentage=application.match_percentage,
            matched_skills=application.matched_skills,
            missing_skills=application.missing_skills,
            resume_id=application.resume_id,
            generated_cv_id=application.generated_cv_id,
            cover_letter_id=application.cover_letter_id,
        )
        for application, user, job in applications
    ]


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Application:
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if current_user.role == UserRole.JOB_SEEKER and application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify this application")
    if current_user.role == UserRole.RECRUITER:
        recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
        job = db.query(Job).filter(Job.id == application.job_id).first()
        if not recruiter or not job or job.recruiter_id != recruiter.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify this application")
    if current_user.role not in {UserRole.JOB_SEEKER, UserRole.RECRUITER, UserRole.ADMIN}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    application.status = payload.status
    db.commit()
    db.refresh(application)
    return application
