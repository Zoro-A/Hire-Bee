from datetime import datetime

from pydantic import BaseModel, Field


class InterviewScheduleCreateRequest(BaseModel):
    application_id: int
    interview_date: datetime
    meeting_link: str = Field(min_length=5, max_length=500)
    notes: str | None = None


class InterviewScheduleResponse(BaseModel):
    id: int
    application_id: int
    recruiter_id: int
    interview_date: datetime
    meeting_link: str
    notes: str | None

    model_config = {"from_attributes": True}
