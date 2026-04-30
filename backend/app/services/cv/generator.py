import json

from app.core.config import get_settings
from app.services.cv.template import build_empty_template, ensure_template_shape


class ConversationalCVGenerator:
    def __init__(self) -> None:
        self.settings = get_settings()

    def generate(self, answers: dict) -> dict:
        if self.settings.openai_api_key:
            llm_result = self._generate_with_langchain(answers)
            if llm_result:
                return llm_result
        return self._fallback_template(answers)

    def _generate_with_langchain(self, answers: dict) -> dict | None:
        try:
            from langchain.prompts import PromptTemplate
            from langchain_openai import ChatOpenAI
        except Exception:
            return None

        llm = ChatOpenAI(api_key=self.settings.openai_api_key, model=self.settings.openai_model, temperature=0.2)
        prompt = PromptTemplate.from_template(
            "Create ATS-friendly resume JSON using this structure exactly: "
            "{template}\n"
            "Use this candidate input:\n{answers}\n"
            "Return strict JSON only."
        )
        chain = prompt | llm
        response = chain.invoke({"answers": json.dumps(answers), "template": json.dumps(build_empty_template())})
        text = getattr(response, "content", "") or ""
        try:
            return ensure_template_shape(json.loads(text))
        except json.JSONDecodeError:
            return None

    @staticmethod
    def _fallback_template(answers: dict) -> dict:
        cv = build_empty_template()
        cv["header"].update(
            {
                "name": answers.get("name", ""),
                "email": answers.get("email", ""),
                "phone": answers.get("phone", ""),
                "location": answers.get("location", ""),
                "linkedin": answers.get("linkedin", ""),
                "github": answers.get("github", ""),
            }
        )
        cv["sections"]["summary"] = answers.get("summary", "")
        cv["sections"]["education"] = answers.get("education", [])
        cv["sections"]["experience"] = answers.get("experience", [])
        cv["sections"]["skills"] = answers.get("skills", [])
        cv["sections"]["projects"] = answers.get("projects", [])
        cv["sections"]["certifications"] = answers.get("certifications", [])
        cv["sections"]["achievements"] = answers.get("achievements", [])
        cv["sections"]["extracurricular"] = answers.get("extracurricular", [])
        cv["sections"]["awards"] = answers.get("awards", [])
        cv["sections"]["interests"] = answers.get("interests", [])
        return ensure_template_shape(cv)
