import json

from app.core.config import get_settings
from app.services.cv.template import build_empty_template, ensure_template_shape


class ConversationalCVGenerator:
    def __init__(self) -> None:
        self.settings = get_settings()

    @staticmethod
    def _parse_json_from_llm(text: str) -> dict | None:
        raw = (text or "").strip()
        if not raw:
            return None
        if "```" in raw:
            for block in raw.split("```"):
                block = block.strip()
                if block.lower().startswith("json"):
                    block = block[4:].lstrip().strip()
                if block.startswith("{") and block.endswith("}"):
                    try:
                        return json.loads(block)
                    except json.JSONDecodeError:
                        continue
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(raw[start : end + 1])
            except json.JSONDecodeError:
                return None
        return None

    def generate(self, answers: dict) -> dict:
        prov = (self.settings.cv_json_llm_provider or "openai").lower()
        if self.settings.openai_api_key and prov == "openai":
            llm_result = self._generate_with_langchain(answers)
            if llm_result:
                return llm_result
        return self._fallback_template(answers)

    def generate_from_transcript(self, messages: list[dict]) -> dict:
        transcript = self._messages_to_transcript(messages)
        prov = (self.settings.cv_json_llm_provider or "openai").lower()
        if prov == "openai" and self.settings.openai_api_key:
            generated = self._generate_json_from_transcript_openai(transcript)
            if generated:
                return generated
        # Future: prov == "qwen_local" → HTTP call to fine-tuned Qwen with transcript + template.
        return self._fallback_from_transcript_text(transcript)

    @staticmethod
    def _messages_to_transcript(messages: list[dict]) -> str:
        lines: list[str] = []
        for m in messages:
            role = (m.get("role") or "user").strip()
            content = (m.get("content") or "").strip()
            if not content or role.lower() == "system":
                continue
            lines.append(f"{role}: {content}")
        return "\n".join(lines)

    def _generate_json_from_transcript_openai(self, transcript: str) -> dict | None:
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_openai import ChatOpenAI
        except Exception:
            return None

        try:
            llm = ChatOpenAI(
                api_key=self.settings.openai_api_key,
                model=self.settings.openai_model,
                temperature=0.2,
            )
            system = SystemMessage(
                content=(
                    "You are a CV JSON generator. Given the full conversation transcript between a career coach "
                    "and the user, produce one JSON object matching this exact shape (keys and nesting):\n"
                    f"{json.dumps(build_empty_template(), ensure_ascii=False)}\n"
                    "Fill sections using only facts from the transcript. Use empty strings or empty arrays when "
                    "unknown. Return JSON only — no markdown fences or commentary."
                )
            )
            human = HumanMessage(content=f"Transcript:\n{transcript}\n\nReturn the CV JSON object only.")
            response = llm.invoke([system, human])
            text = getattr(response, "content", "") or ""
            parsed = self._parse_json_from_llm(text)
            if parsed:
                return ensure_template_shape(parsed)
        except Exception:
            return None
        return None

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
        parsed = self._parse_json_from_llm(text)
        if parsed:
            return ensure_template_shape(parsed)
        return None

    @staticmethod
    def _fallback_from_transcript_text(transcript: str) -> dict:
        cv = build_empty_template()
        summary = transcript.strip()
        if len(summary) > 4000:
            summary = summary[:3997] + "..."
        cv["sections"]["summary"] = summary or "Generated from conversation (no API key or JSON parse failed)."
        return ensure_template_shape(cv)

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
