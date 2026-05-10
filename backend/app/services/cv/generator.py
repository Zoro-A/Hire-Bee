import json
from functools import lru_cache

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
        if prov == "qwen_local":
            generated = self._generate_json_from_transcript_qwen_local(transcript)
            if generated:
                return generated
        return self._fallback_from_transcript_messages(messages)

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

    @staticmethod
    @lru_cache(maxsize=1)
    def _load_qwen_local_stack(adapter_path: str, base_model: str, device_pref: str):
        from peft import PeftModel
        from transformers import AutoModelForCausalLM, AutoTokenizer

        tokenizer = AutoTokenizer.from_pretrained(adapter_path, use_fast=True)
        if device_pref == "cpu":
            model = AutoModelForCausalLM.from_pretrained(base_model, torch_dtype="auto")
            model = PeftModel.from_pretrained(model, adapter_path)
            model = model.to("cpu")
        else:
            model = AutoModelForCausalLM.from_pretrained(
                base_model,
                torch_dtype="auto",
                device_map="auto",
            )
            model = PeftModel.from_pretrained(model, adapter_path)
        model.eval()
        return tokenizer, model

    def _generate_json_from_transcript_qwen_local(self, transcript: str) -> dict | None:
        adapter_path = (self.settings.qwen_local_adapter_path or "").strip()
        if not adapter_path:
            return None
        try:
            tokenizer, model = self._load_qwen_local_stack(
                adapter_path=adapter_path,
                base_model=self.settings.qwen_local_base_model,
                device_pref=(self.settings.qwen_local_device or "auto").lower(),
            )
            base_messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a CV JSON generator. Given the full conversation transcript between a career coach "
                        "and the user, produce one JSON object matching this exact shape (keys and nesting):\n"
                        f"{json.dumps(build_empty_template(), ensure_ascii=False)}\n"
                        "Fill sections using only facts from the transcript. Use empty strings or empty arrays when "
                        "unknown. Return JSON only — no markdown fences or commentary."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Transcript:\n{transcript}\n\nReturn the CV JSON object only.",
                },
            ]

            def _run(messages: list[dict], temperature: float) -> str:
                prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                model_inputs = tokenizer([prompt], return_tensors="pt").to(model.device)
                output_ids = model.generate(
                    **model_inputs,
                    max_new_tokens=max(256, int(self.settings.qwen_local_max_new_tokens)),
                    temperature=temperature,
                    do_sample=temperature > 0,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                )
                gen_ids = output_ids[0][len(model_inputs.input_ids[0]) :]
                return tokenizer.decode(gen_ids, skip_special_tokens=True)

            text = _run(base_messages, float(self.settings.qwen_local_temperature))
            parsed = self._parse_json_from_llm(text)
            if parsed:
                return ensure_template_shape(parsed)

            # Retry once with strict "repair to valid JSON" instruction.
            repair_messages = base_messages + [
                {"role": "assistant", "content": text[:2000]},
                {
                    "role": "user",
                    "content": (
                        "Your previous answer was not valid JSON. Re-output ONLY one valid JSON object with the exact "
                        "same CV schema. No markdown, no explanation."
                    ),
                },
            ]
            repaired_text = _run(repair_messages, 0.0)
            repaired = self._parse_json_from_llm(repaired_text)
            if repaired:
                return ensure_template_shape(repaired)
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
    def _fallback_from_transcript_messages(messages: list[dict]) -> dict:
        cv = build_empty_template()
        user_lines = [
            (m.get("content") or "").strip()
            for m in messages
            if (m.get("role") or "").lower() == "user" and (m.get("content") or "").strip()
        ]
        if not user_lines:
            cv["sections"]["summary"] = "Generated from conversation (model output could not be parsed)."
            return ensure_template_shape(cv)

        # Keep CV fallback professional: summarize from user content only (not assistant prompts).
        long_lines = [line for line in user_lines if len(line) > 120]
        headline = user_lines[0][:220]
        recent = long_lines[-1] if long_lines else user_lines[-1]
        summary = f"Target profile: {headline}. Recent focus: {recent[:420]}"
        cv["sections"]["summary"] = summary[:900]

        experience_bullets: list[dict] = []
        for line in long_lines[-3:]:
            parts = [p.strip(" -•\n\t") for p in line.replace("\r", "").split(". ") if p.strip()]
            for p in parts[:4]:
                experience_bullets.append(
                    {
                        "company": "",
                        "role": "Generative AI Engineer",
                        "start_date": "",
                        "end_date": "",
                        "description": p[:280],
                    }
                )
            if len(experience_bullets) >= 6:
                break
        if experience_bullets:
            cv["sections"]["experience"] = experience_bullets

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
