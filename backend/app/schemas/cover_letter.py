from pydantic import BaseModel, Field, field_validator


class CoverLetterGenerateRequest(BaseModel):
    job_id: int
    resume_id: int | None = None
    generated_cv_id: int | None = None
    tone: str = Field(default="professional", max_length=50)


class CoverLetterUpdateRequest(BaseModel):
    content: str = Field(min_length=20, max_length=12000)

    @field_validator("content", mode="before")
    @classmethod
    def strip_then_validate_length(cls, v: object) -> object:
        """Strip so min_length/max_length apply to the string we persist, not padding."""
        if isinstance(v, str):
            return v.strip()
        return v


class CoverLetterResponse(BaseModel):
    id: int
    job_id: int | None
    content: str
    model_name: str

    model_config = {"from_attributes": True}
