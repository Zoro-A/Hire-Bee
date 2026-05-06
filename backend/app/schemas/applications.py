from datetime import datetime

from pydantic import BaseModel

from app.models.entities import ApplicationStatus


class ApplicationCreateRequest(BaseModel):
    job_id: int
    resume_id: int | None = None
    generated_cv_id: int | None = None
    cover_letter_id: int | None = None


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    user_id: int
    status: ApplicationStatus
    resume_id: int | None
    generated_cv_id: int | None
    cover_letter_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationStatusUpdateRequest(BaseModel):
    status: ApplicationStatus


class RecruiterApplicationView(BaseModel):
    application_id: int
    candidate_name: str
    candidate_email: str
    job_id: int
    job_title: str
    status: ApplicationStatus
    match_percentage: float | None
    matched_skills: list | None
    missing_skills: list | None
    resume_id: int | None
    generated_cv_id: int | None
    cover_letter_id: int | None


class RecruiterApplicationDetailResponse(BaseModel):
    application_id: int
    candidate_name: str
    candidate_email: str
    job_id: int
    job_title: str
    status: ApplicationStatus
    match_percentage: float | None
    matched_skills: list | None
    missing_skills: list | None
    resume: dict | None = None
    cover_letter: dict | None = None
    generated_cv: dict | None = None
