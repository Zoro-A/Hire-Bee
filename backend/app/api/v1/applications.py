from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.config import get_settings
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
    RecruiterApplicationDetailResponse,
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
        .order_by(func.coalesce(Application.match_percentage, -1.0).desc(), Application.created_at.desc())
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


def _application_for_recruiter(
    db: Session, application_id: int, recruiter: Recruiter
) -> tuple[Application, User, Job] | None:
    row = (
        db.query(Application, User, Job)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .filter(Application.id == application_id, Job.recruiter_id == recruiter.id)
        .first()
    )
    if not row:
        return None
    return row


@router.get("/recruiter/{application_id}/detail", response_model=RecruiterApplicationDetailResponse)
def recruiter_application_detail(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECRUITER)),
) -> RecruiterApplicationDetailResponse:
    recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found")

    row = _application_for_recruiter(db, application_id, recruiter)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    application, user, job = row

    resume_payload: dict | None = None
    if application.resume_id:
        resume = db.query(Resume).filter(Resume.id == application.resume_id).first()
        if resume:
            resume_payload = {
                "id": resume.id,
                "file_name": resume.file_name,
                "parsing_confidence": resume.parsing_confidence,
                "parsed_data": resume.parsed_data or {},
            }

    cover_payload: dict | None = None
    if application.cover_letter_id:
        letter = db.query(CoverLetter).filter(CoverLetter.id == application.cover_letter_id).first()
        if letter:
            cover_payload = {"id": letter.id, "content": letter.content}

    cv_payload: dict | None = None
    if application.generated_cv_id:
        gcv = db.query(GeneratedCV).filter(GeneratedCV.id == application.generated_cv_id).first()
        if gcv:
            cv_payload = {
                "id": gcv.id,
                "title": gcv.title,
                "cv_json": gcv.cv_json or {},
                "has_pdf": bool(gcv.pdf_path),
                "has_docx": bool(gcv.docx_path),
            }

    return RecruiterApplicationDetailResponse(
        application_id=application.id,
        candidate_name=user.full_name,
        candidate_email=user.email,
        job_id=job.id,
        job_title=job.title,
        status=application.status,
        match_percentage=application.match_percentage,
        matched_skills=application.matched_skills,
        missing_skills=application.missing_skills,
        resume=resume_payload,
        cover_letter=cover_payload,
        generated_cv=cv_payload,
    )


@router.get("/recruiter/{application_id}/resume-file")
def recruiter_download_application_resume(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECRUITER)),
) -> FileResponse:
    settings = get_settings()
    recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found")

    row = _application_for_recruiter(db, application_id, recruiter)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    application, _user, _job = row
    if not application.resume_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume attached to this application")

    resume = db.query(Resume).filter(Resume.id == application.resume_id).first()
    if not resume or not resume.file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found")

    base = Path(settings.resume_storage_dir).resolve()
    file_path = Path(resume.file_path).resolve()
    try:
        file_path.relative_to(base)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid resume path") from exc

    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file missing on disk")

    suffix = file_path.suffix.lower()
    media = (
        "application/pdf"
        if suffix == ".pdf"
        else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    return FileResponse(path=file_path, filename=resume.file_name or file_path.name, media_type=media)


@router.get("/recruiter/{application_id}/cv-download")
def recruiter_download_application_cv(
    application_id: int,
    export_format: str = Query(..., pattern="^(pdf|docx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECRUITER)),
) -> FileResponse:
    settings = get_settings()
    recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found")

    row = _application_for_recruiter(db, application_id, recruiter)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    application, user, _job = row
    if not application.generated_cv_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No generated CV on this application")

    cv = db.query(GeneratedCV).filter(GeneratedCV.id == application.generated_cv_id).first()
    if not cv or cv.user_id != application.user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generated CV not found")

    ext = "pdf" if export_format == "pdf" else "docx"
    folder = "pdf" if export_format == "pdf" else "docx"
    base = Path(settings.generated_assets_dir).resolve()
    file_path = (Path(settings.generated_assets_dir) / folder / str(user.id) / f"cv_{cv.id}.{ext}").resolve()

    try:
        file_path.relative_to(base)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid export path") from exc

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {ext.upper()} export yet for this CV.",
        )

    raw_title = (cv.title or "cv").strip() or "cv"
    safe_name = "".join(ch for ch in raw_title if ch.isalnum() or ch in " -_")[:80] or "cv"
    filename = f"{safe_name}_{cv.id}.{ext}"
    media = (
        "application/pdf"
        if ext == "pdf"
        else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    return FileResponse(path=file_path, filename=filename, media_type=media)


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
