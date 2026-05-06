from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Boolean, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class UserRole(str, Enum):
    JOB_SEEKER = "job_seeker"
    RECRUITER = "recruiter"
    ADMIN = "admin"


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    HIRED = "hired"
    REJECTED = "rejected"


class ClusterMethod(str, Enum):
    EMBEDDING_DISTANCE = "embedding_distance"
    COSINE_SIMILARITY = "cosine_similarity"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), default=UserRole.JOB_SEEKER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Recruiter(Base, TimestampMixin):
    __tablename__ = "recruiters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    recruiter_email: Mapped[str] = mapped_column(String(255), nullable=False)

    user: Mapped["User"] = relationship()


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    recruiter_id: Mapped[int] = mapped_column(ForeignKey("recruiters.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    salary: Mapped[float | None] = mapped_column(Float, nullable=True)
    recruiter_email: Mapped[str] = mapped_column(String(255), nullable=False)

    recruiter: Mapped["Recruiter"] = relationship()
    skills: Mapped[list["JobSkill"]] = relationship(back_populates="job", cascade="all, delete-orphan")


class JobSkill(Base):
    __tablename__ = "job_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), nullable=False, index=True)
    skill_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    normalized_skill: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    job: Mapped["Job"] = relationship(back_populates="skills")


class CandidateSkill(Base, TimestampMixin):
    __tablename__ = "candidate_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    skill_name: Mapped[str] = mapped_column(String(100), nullable=False)
    normalized_skill: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(50), default="resume", nullable=False)


class Resume(Base, TimestampMixin):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    parsed_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    raw_text: Mapped[str] = mapped_column(Text, nullable=True)
    parsing_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)


class GeneratedCV(Base, TimestampMixin):
    __tablename__ = "generated_cvs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    cv_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    docx_path: Mapped[str | None] = mapped_column(String(500), nullable=True)


class CoverLetter(Base, TimestampMixin):
    __tablename__ = "cover_letters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), default="openai", nullable=False)


class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), nullable=False, index=True)
    resume_id: Mapped[int | None] = mapped_column(ForeignKey("resumes.id"), nullable=True)
    generated_cv_id: Mapped[int | None] = mapped_column(ForeignKey("generated_cvs.id"), nullable=True)
    cover_letter_id: Mapped[int | None] = mapped_column(ForeignKey("cover_letters.id"), nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(SqlEnum(ApplicationStatus), default=ApplicationStatus.APPLIED)
    match_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    matched_skills: Mapped[list | None] = mapped_column(JSON, nullable=True)
    missing_skills: Mapped[list | None] = mapped_column(JSON, nullable=True)


class Email(Base, TimestampMixin):
    __tablename__ = "emails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="queued", nullable=False)
    provider: Mapped[str] = mapped_column(String(50), default="smtp", nullable=False)


class InterviewSchedule(Base, TimestampMixin):
    __tablename__ = "interview_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), nullable=False, index=True)
    recruiter_id: Mapped[int] = mapped_column(ForeignKey("recruiters.id"), nullable=False)
    interview_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    meeting_link: Mapped[str] = mapped_column(String(500), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class JobClusterRun(Base, TimestampMixin):
    __tablename__ = "job_cluster_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    method: Mapped[ClusterMethod] = mapped_column(SqlEnum(ClusterMethod), nullable=False)
    k: Mapped[int] = mapped_column(Integer, nullable=False)
    total_jobs: Mapped[int] = mapped_column(Integer, nullable=False)
    silhouette_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    intra_cluster_distance: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_cosine_similarity: Mapped[float | None] = mapped_column(Float, nullable=True)
    metrics_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class JobClusterAssignment(Base, TimestampMixin):
    __tablename__ = "job_cluster_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("job_cluster_runs.id"), nullable=False, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"), nullable=False, index=True)
    cluster_label: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    distance_to_centroid: Mapped[float | None] = mapped_column(Float, nullable=True)
    cosine_to_centroid: Mapped[float | None] = mapped_column(Float, nullable=True)


class JobRecommendationEvaluation(Base, TimestampMixin):
    __tablename__ = "job_recommendation_evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("job_cluster_runs.id"), nullable=False, index=True)
    candidate_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    top_k: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    precision_at_k: Mapped[float] = mapped_column(Float, nullable=False)
    recall_at_k: Mapped[float] = mapped_column(Float, nullable=False)
    ndcg_at_k: Mapped[float] = mapped_column(Float, nullable=False)
    mrr: Mapped[float] = mapped_column(Float, nullable=False)


class CVQualityEvaluation(Base, TimestampMixin):
    __tablename__ = "cv_quality_evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cv_id: Mapped[int] = mapped_column(ForeignKey("generated_cvs.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    evaluator: Mapped[str] = mapped_column(String(50), nullable=False, default="gemini")
    model_name: Mapped[str] = mapped_column(String(100), nullable=False, default="gemini-1.5-flash")
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    faithfulness_score: Mapped[float] = mapped_column(Float, nullable=False)
    relevance_score: Mapped[float] = mapped_column(Float, nullable=False)
    professionalism_score: Mapped[float] = mapped_column(Float, nullable=False)
    completeness_score: Mapped[float] = mapped_column(Float, nullable=False)
    impact_score: Mapped[float] = mapped_column(Float, nullable=False)
    strengths: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    weaknesses: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    recommendations: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    transcript_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
