from pydantic import BaseModel, Field


class CoverLetterGenerateRequest(BaseModel):
    job_id: int
    tone: str = Field(default="professional", max_length=50)


class CoverLetterResponse(BaseModel):
    id: int
    job_id: int | None
    content: str
    model_name: str

    model_config = {"from_attributes": True}
