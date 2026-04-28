from pydantic import BaseModel, EmailStr, Field


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=20)
    location: str | None = None
    salary: float | None = None
    recruiter_email: EmailStr
    required_skills: list[str] = Field(default_factory=list)
