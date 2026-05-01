from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.database import get_db
from app.models.entities import (
    Application,
    ApplicationStatus,
    InterviewSchedule,
    Job,
    Recruiter,
    User,
    UserRole,
)
from app.schemas.interviews import InterviewScheduleCreateRequest, InterviewScheduleResponse
from app.services.email.smtp_service import SMTPEmailService

router = APIRouter(prefix="/interviews", tags=["interviews"])
email_service = SMTPEmailService()


@router.post("/schedule", response_model=InterviewScheduleResponse, status_code=status.HTTP_201_CREATED)
def schedule_interview(
    payload: InterviewScheduleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECRUITER)),
) -> InterviewSchedule:
    recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found")

    application = db.query(Application).filter(Application.id == payload.application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    job = db.query(Job).filter(Job.id == application.job_id).first()
    if not job or job.recruiter_id != recruiter.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Application does not belong to your job")

    interview = InterviewSchedule(
        application_id=application.id,
        recruiter_id=recruiter.id,
        interview_date=payload.interview_date,
        meeting_link=payload.meeting_link,
        notes=payload.notes,
    )
    application.status = ApplicationStatus.INTERVIEW
    db.add(interview)
    db.commit()
    db.refresh(interview)
    db.refresh(application)

    candidate = db.query(User).filter(User.id == application.user_id).first()
    if candidate:
        email_body = (
            f"Interview scheduled for your application to '{job.title}'.\n\n"
            f"Date/Time: {payload.interview_date}\n"
            f"Meeting Link: {payload.meeting_link}\n"
            f"Notes: {payload.notes or 'N/A'}\n"
        )
        email_service.send_email(
            db=db,
            recipient=candidate.email,
            subject=f"Interview Scheduled: {job.title}",
            body=email_body,
            attachment_paths=[],
        )

    return interview


@router.get("/recruiter", response_model=list[InterviewScheduleResponse])
def list_recruiter_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECRUITER)),
) -> list[InterviewSchedule]:
    recruiter = db.query(Recruiter).filter(Recruiter.user_id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter profile not found")
    return (
        db.query(InterviewSchedule)
        .filter(InterviewSchedule.recruiter_id == recruiter.id)
        .order_by(InterviewSchedule.interview_date.desc())
        .all()
    )
