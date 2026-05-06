from pydantic import BaseModel, Field, model_validator


class ManualCVUpsertRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    cv_json: dict


class TranscriptMessage(BaseModel):
    role: str = Field(min_length=1, max_length=20)
    content: str = Field(min_length=1, max_length=16000)


class ConversationalChatRequest(BaseModel):
    messages: list[TranscriptMessage] = Field(min_length=1, max_length=80)


class ConversationalChatResponse(BaseModel):
    reply: str


class ConversationalCVRequest(BaseModel):
    title: str = Field(default="AI Generated CV", min_length=2, max_length=255)
    answers: dict | None = None
    messages: list[TranscriptMessage] | None = None

    @model_validator(mode="after")
    def require_source(self) -> "ConversationalCVRequest":
        if self.messages and len(self.messages) > 0:
            return self
        if self.answers is not None and len(self.answers) > 0:
            return self
        raise ValueError("Provide `messages` (conversation transcript) or legacy non-empty `answers`.")


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
    cv_quality_score: float | None = None

    model_config = {"from_attributes": True}
