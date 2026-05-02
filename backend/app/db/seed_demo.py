"""
Insert demo rows for local testing (20 per domain table).

The `users` table gets 40 rows (20 job_seeker + 20 recruiter) so `recruiters`
can have 20 rows while every other table also has 20 rows with valid FKs.

Run from the `backend` directory:

    python -m app.db.seed_demo

Re-running removes previous seed rows (matched by email / subject prefix) and re-inserts.

Logins use @example.com (not .test) so Pydantic EmailStr on /auth/login accepts them.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_password_hash
from app.db.database import SessionLocal
from app.models.entities import (
    Application,
    ApplicationStatus,
    CandidateSkill,
    CoverLetter,
    Email,
    GeneratedCV,
    InterviewSchedule,
    Job,
    JobSkill,
    Recruiter,
    Resume,
    User,
    UserRole,
)
from app.services.cv.template import build_empty_template
from app.services.matching.skill_matcher import SkillMatcherService

# Must use a domain accepted by Pydantic EmailStr (e.g. .test is rejected as reserved).
SEEKER_EMAIL = "seed-seeker-{:02d}@example.com"
RECRUITER_EMAIL = "seed-recruiter-{:02d}@example.com"
SEED_EMAIL_SUBJECT_PREFIX = "[HireBee seed demo]"
DEMO_PASSWORD_HASH = get_password_hash("SeedDemo123!")


def _clear_seed_data(db: Session) -> None:
    seeker_ids = list(
        db.scalars(
            select(User.id).where(
                or_(
                    User.email.like("seed-seeker-%@example.com"),
                    User.email.like("seed-seeker-%@hirebee.test"),
                )
            )
        ).all()
    )
    recruiter_user_ids = list(
        db.scalars(
            select(User.id).where(
                or_(
                    User.email.like("seed-recruiter-%@example.com"),
                    User.email.like("seed-recruiter-%@hirebee.test"),
                )
            )
        ).all()
    )
    all_seed_user_ids = seeker_ids + recruiter_user_ids
    if not all_seed_user_ids:
        return

    recruiter_row_ids = list(
        db.scalars(select(Recruiter.id).where(Recruiter.user_id.in_(recruiter_user_ids))).all()
    )
    seed_job_ids: list[int] = []
    if recruiter_row_ids:
        seed_job_ids = list(db.scalars(select(Job.id).where(Job.recruiter_id.in_(recruiter_row_ids))).all())

    app_ids = []
    if seeker_ids:
        app_ids = list(db.scalars(select(Application.id).where(Application.user_id.in_(seeker_ids))).all())

    if app_ids:
        db.execute(delete(InterviewSchedule).where(InterviewSchedule.application_id.in_(app_ids)))
    if seeker_ids:
        db.execute(delete(Application).where(Application.user_id.in_(seeker_ids)))
    if seeker_ids:
        db.execute(delete(CoverLetter).where(CoverLetter.user_id.in_(seeker_ids)))
    if seeker_ids:
        db.execute(delete(GeneratedCV).where(GeneratedCV.user_id.in_(seeker_ids)))
    if seeker_ids:
        db.execute(delete(Resume).where(Resume.user_id.in_(seeker_ids)))
    if seeker_ids:
        db.execute(delete(CandidateSkill).where(CandidateSkill.user_id.in_(seeker_ids)))
    if seed_job_ids:
        db.execute(delete(JobSkill).where(JobSkill.job_id.in_(seed_job_ids)))
        db.execute(delete(Job).where(Job.id.in_(seed_job_ids)))
    if recruiter_row_ids:
        db.execute(delete(Recruiter).where(Recruiter.id.in_(recruiter_row_ids)))
    db.execute(delete(Email).where(Email.subject.startswith(SEED_EMAIL_SUBJECT_PREFIX)))
    db.execute(delete(User).where(User.id.in_(all_seed_user_ids)))
    db.commit()


def seed_demo_data(db: Session) -> None:
    _clear_seed_data(db)

    seekers: list[User] = []
    for i in range(1, 21):
        u = User(
            email=SEEKER_EMAIL.format(i),
            hashed_password=DEMO_PASSWORD_HASH,
            full_name=f"Demo Seeker {i}",
            role=UserRole.JOB_SEEKER,
            is_active=True,
        )
        db.add(u)
        seekers.append(u)
    db.flush()

    recruiters_users: list[User] = []
    for i in range(1, 21):
        u = User(
            email=RECRUITER_EMAIL.format(i),
            hashed_password=DEMO_PASSWORD_HASH,
            full_name=f"Demo Recruiter {i}",
            role=UserRole.RECRUITER,
            is_active=True,
        )
        db.add(u)
        recruiters_users.append(u)
    db.flush()

    recruiters: list[Recruiter] = []
    for i, u in enumerate(recruiters_users, start=1):
        r = Recruiter(
            user_id=u.id,
            company_name=f"Demo Corp {i}",
            recruiter_email=u.email,
        )
        db.add(r)
        recruiters.append(r)
    db.flush()

    jobs: list[Job] = []
    titles = [
        "Backend Engineer",
        "Frontend Developer",
        "Full Stack Engineer",
        "Data Analyst",
        "ML Engineer",
        "DevOps Engineer",
        "Product Manager",
        "QA Automation",
        "Security Engineer",
        "Mobile Developer",
        "Cloud Architect",
        "Site Reliability Engineer",
        "Technical Writer",
        "UX Designer",
        "Solutions Architect",
        "Engineering Manager",
        "Data Engineer",
        "Platform Engineer",
        "Support Engineer",
        "IT Administrator",
    ]
    for i in range(20):
        j = Job(
            recruiter_id=recruiters[i].id,
            title=titles[i],
            description=f"Demo job description #{i + 1}. Stack includes Python, FastAPI, and React. Remote-friendly team.",
            location=["Remote", "New York", "London", "Berlin", "Toronto"][i % 5],
            salary=80000.0 + i * 2500,
            recruiter_email=recruiters[i].recruiter_email,
        )
        db.add(j)
        jobs.append(j)
    db.flush()

    skill_pairs = [
        ("Python", "python"),
        ("FastAPI", "fastapi"),
        ("React", "react"),
        ("PostgreSQL", "postgresql"),
        ("Docker", "docker"),
        ("Kubernetes", "kubernetes"),
        ("AWS", "aws"),
        ("TypeScript", "typescript"),
        ("SQL", "sql"),
        ("Git", "git"),
        ("REST APIs", "rest apis"),
        ("GraphQL", "graphql"),
        ("Redis", "redis"),
        ("Celery", "celery"),
        ("Pytest", "pytest"),
        ("CI/CD", "ci/cd"),
        ("Linux", "linux"),
        ("Terraform", "terraform"),
        ("Kafka", "kafka"),
        ("Elasticsearch", "elasticsearch"),
    ]
    # Five skills per job (spread indices) so overlap with a seeker profile is usually 20–100%, not binary.
    job_offsets = (0, 5, 10, 15, 7)
    for i in range(20):
        for off in job_offsets:
            idx = (i + off) % 20
            name, norm = skill_pairs[idx]
            db.add(JobSkill(job_id=jobs[i].id, skill_name=name, normalized_skill=norm))
    db.flush()

    # Ten consecutive skills on the wheel per seeker (rotated by seeker index) → variable match vs each job.
    for idx, s in enumerate(seekers):
        for k in range(10):
            j = (idx + k) % 20
            name, norm = skill_pairs[j]
            db.add(CandidateSkill(user_id=s.id, skill_name=name, normalized_skill=norm, source="resume"))
    db.flush()

    # Re-index job skills for Qdrant so semantic fallback works when exact overlap is thin.
    matcher = SkillMatcherService()
    seeded_jobs = (
        db.query(Job)
        .options(joinedload(Job.skills))
        .filter(Job.recruiter_id.in_([r.id for r in recruiters]))
        .order_by(Job.id)
        .all()
    )
    for job in seeded_jobs:
        norms = sorted({sk.normalized_skill for sk in job.skills if sk.normalized_skill})
        if norms:
            try:
                matcher.index_job_skills(job.id, norms)
            except Exception:
                pass

    for i, s in enumerate(seekers, start=1):
        db.add(
            Resume(
                user_id=s.id,
                file_name=f"demo_resume_{i}.pdf",
                file_path=f"storage/resumes/seed/demo_seeker_{i}.pdf",
                parsed_data={"name": s.full_name, "email": s.email, "summary": f"Demo summary for seeker {i}."},
                raw_text=f"Demo resume text body for seeker {i}.",
                parsing_confidence=0.75 + (i % 10) * 0.02,
            )
        )
    db.flush()

    resumes = list(
        db.scalars(select(Resume).where(Resume.user_id.in_([s.id for s in seekers])).order_by(Resume.id)).all()
    )

    for i, s in enumerate(seekers, start=1):
        tpl = build_empty_template(title=f"Demo CV {i}")
        tpl["header"]["name"] = s.full_name
        tpl["header"]["email"] = s.email
        tpl["sections"]["summary"] = f"Professional summary for demo seeker {i}."
        db.add(GeneratedCV(user_id=s.id, title=f"Demo Generated CV {i}", cv_json=tpl))
    db.flush()

    gen_cvs = list(
        db.scalars(select(GeneratedCV).where(GeneratedCV.user_id.in_([s.id for s in seekers])).order_by(GeneratedCV.id)).all()
    )

    for i, s in enumerate(seekers, start=1):
        job = jobs[(i - 1) % 20]
        db.add(
            CoverLetter(
                user_id=s.id,
                job_id=job.id,
                content=f"Dear Hiring Manager,\n\nThis is a demo cover letter for seeker {i} applying to {job.title}.\n\nBest,\n{s.full_name}",
                model_name="openai",
            )
        )
    db.flush()

    letters = list(
        db.scalars(
            select(CoverLetter).where(CoverLetter.user_id.in_([s.id for s in seekers])).order_by(CoverLetter.id)
        ).all()
    )

    statuses = list(ApplicationStatus)
    for i in range(20):
        db.add(
            Application(
                user_id=seekers[i].id,
                job_id=jobs[i].id,
                resume_id=resumes[i].id,
                generated_cv_id=gen_cvs[i].id,
                cover_letter_id=letters[i].id,
                status=statuses[i % len(statuses)],
                match_percentage=60.0 + (i % 15),
                matched_skills=["python", "fastapi"],
                missing_skills=["kubernetes"],
            )
        )
    db.flush()

    applications = list(
        db.scalars(
            select(Application).where(Application.user_id.in_([s.id for s in seekers])).order_by(Application.id)
        ).all()
    )

    for i in range(20):
        db.add(
            Email(
                sender="notifications@hirebee.test",
                recipient=seekers[i].email,
                subject=f"{SEED_EMAIL_SUBJECT_PREFIX} Application update #{i + 1}",
                body=f"Demo email body for seeker {i + 1}.",
                status="sent",
                provider="smtp",
            )
        )

    for i in range(20):
        interview_dt = datetime.now(UTC) + timedelta(days=3 + i)
        db.add(
            InterviewSchedule(
                application_id=applications[i].id,
                recruiter_id=recruiters[i % 20].id,
                interview_date=interview_dt,
                meeting_link=f"https://meet.hirebee.test/demo-{i + 1}",
                notes=f"Demo interview notes #{i + 1}",
            )
        )

    db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    print(
        "Seed complete: 40 users (20 seekers + 20 recruiters), 20 rows per other table. "
        "Log in as seed-seeker-01@example.com / SeedDemo123!",
    )


if __name__ == "__main__":
    main()
