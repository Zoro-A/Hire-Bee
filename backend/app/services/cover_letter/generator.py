import json

from app.core.config import get_settings


class CoverLetterGenerator:
    def __init__(self) -> None:
        self.settings = get_settings()

    def generate(
        self,
        profile: dict,
        resume_data: dict,
        job_data: dict,
        tone: str = "professional",
    ) -> tuple[str, str]:
        if self.settings.openai_api_key:
            result = self._generate_with_langchain(profile, resume_data, job_data, tone)
            if result:
                return result, "openai"
        return self._fallback(profile, job_data, tone), "template"

    def _generate_with_langchain(self, profile: dict, resume_data: dict, job_data: dict, tone: str) -> str | None:
        try:
            from langchain.prompts import PromptTemplate
            from langchain_openai import ChatOpenAI
        except Exception:
            return None

        llm = ChatOpenAI(api_key=self.settings.openai_api_key, model=self.settings.openai_model, temperature=0.3)
        prompt = PromptTemplate.from_template(
            "Write a concise, personalized cover letter in {tone} tone.\n"
            "Profile: {profile}\nResume: {resume}\nJob: {job}\n"
            "Return plain text only."
        )
        chain = prompt | llm
        response = chain.invoke(
            {
                "tone": tone,
                "profile": json.dumps(profile),
                "resume": json.dumps(resume_data),
                "job": json.dumps(job_data),
            }
        )
        text = getattr(response, "content", "") or ""
        return text.strip() or None

    @staticmethod
    def _fallback(profile: dict, job_data: dict, tone: str) -> str:
        name = profile.get("full_name", "Candidate")
        title = job_data.get("title", "the role")
        company = job_data.get("company_name", "your company")
        return (
            f"Dear Hiring Manager,\n\n"
            f"I am writing to apply for {title} at {company}. With my background in software and AI systems, "
            f"I can contribute effectively from day one. I am especially interested in this role because it aligns "
            f"with my experience building production-ready backend services.\n\n"
            f"I would welcome the opportunity to discuss how I can support your team.\n\n"
            f"Sincerely,\n{name}\n\nTone: {tone}"
        )
