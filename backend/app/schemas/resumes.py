from pydantic import BaseModel


class ResumeParseResponse(BaseModel):
    resume_id: int
    file_name: str
    parsing_confidence: float
    used_fallback_llm: bool
    parsed_data: dict
    extracted_skills: list[str]
