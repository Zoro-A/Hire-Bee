from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class ManualCVUpsertRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    cv_json: dict


class TranscriptMessage(BaseModel):
    role: str = Field(min_length=1, max_length=20)
    content: str = Field(min_length=1, max_length=16000)


class ConversationalChatRequest(BaseModel):
    messages: list[TranscriptMessage] | None = Field(default=None, max_length=80)
    message: str | None = Field(default=None, min_length=1, max_length=16000)

    @model_validator(mode="after")
    def require_message_source(self) -> "ConversationalChatRequest":
        has_messages = bool(self.messages and len(self.messages) > 0)
        has_single = bool((self.message or "").strip())
        if has_messages or has_single:
            return self
        raise ValueError("Provide either `messages` or `message`.")


class CVJudgeScoresLite(BaseModel):
    overall: float = Field(ge=0, le=100)
    faithfulness: float = Field(ge=0, le=100)
    relevance: float = Field(ge=0, le=100)
    professionalism: float = Field(ge=0, le=100)
    completeness: float = Field(ge=0, le=100)
    impact: float = Field(ge=0, le=100)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class CVLatestEvaluationLite(BaseModel):
    cv_id: int
    model_name: str
    evaluator: str
    created_at: datetime
    scores: CVJudgeScoresLite


class ConversationHistoryResponse(BaseModel):
    messages: list[TranscriptMessage]
    latest_cv_evaluation: CVLatestEvaluationLite | None = None


class ConversationalChatResponse(BaseModel):
    reply: str
    messages: list[TranscriptMessage] | None = None
    latest_cv_evaluation: CVLatestEvaluationLite | None = None


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
