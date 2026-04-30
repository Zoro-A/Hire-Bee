from pydantic import BaseModel, Field


class ManualCVUpsertRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    cv_json: dict


class ConversationalCVRequest(BaseModel):
    title: str = Field(default="AI Generated CV", min_length=2, max_length=255)
    answers: dict


class SectionOrderUpdateRequest(BaseModel):
    section_order: list[str]


class SectionUpsertRequest(BaseModel):
    section_key: str = Field(min_length=1, max_length=100)
    label: str | None = None
    content: list | dict | str


class CVTemplateResponse(BaseModel):
    template_id: str
    name: str
    description: str
    section_library: list[dict]
    default_structure: dict


class CVResponse(BaseModel):
    id: int
    title: str
    cv_json: dict
    pdf_path: str | None
    docx_path: str | None

    model_config = {"from_attributes": True}
