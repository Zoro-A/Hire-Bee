from pydantic import BaseModel


class MatchedJobResponse(BaseModel):
    job_id: int
    title: str
    location: str | None
    salary: float | None
    recruiter_email: str
    match_percentage: float
    matched_skills: list[str]
    missing_skills: list[str]
