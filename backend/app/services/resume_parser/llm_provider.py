import json

from openai import OpenAI

from app.core.config import get_settings


class ResumeLLMProvider:
    def __init__(self) -> None:
        settings = get_settings()
        self.model = settings.openai_model
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def is_available(self) -> bool:
        return self.client is not None

    def parse_resume(self, text: str) -> dict | None:
        if not self.client:
            return None

        prompt = (
            "Extract the resume into strict JSON with keys: "
            "name,email,phone,education,experience,projects,skills,certifications,achievements. "
            "Return only JSON."
        )
        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0,
            messages=[
                {"role": "system", "content": "You are a resume parser."},
                {"role": "user", "content": f"{prompt}\n\nResume:\n{text[:12000]}"},
            ],
        )
        content = response.choices[0].message.content or ""
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return None
