import re
from dataclasses import dataclass

from app.services.resume_parser.llm_provider import ResumeLLMProvider
from app.services.resume_parser.skills import extract_skills_from_text

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
EMAIL_RELAXED_RE = re.compile(r"\b([A-Za-z0-9._%+-]+)\s*@\s*([A-Za-z0-9.-]+)\s*\.\s*([A-Za-z]{2,})\b")
PHONE_RE = re.compile(r"(\+?\d[\d\-\s()]{7,}\d)")
LINKEDIN_RE = re.compile(r"((?:https?://)?(?:www\.)?linkedin\.com/[^\s|,;]+)", re.IGNORECASE)
GITHUB_RE = re.compile(r"((?:https?://)?(?:www\.)?github\.com/[^\s|,;]+)", re.IGNORECASE)
SECTION_PATTERNS = {
    "education": re.compile(r"\beducation\b", re.IGNORECASE),
    "experience": re.compile(r"\b(professional experience|work experience|experience)\b", re.IGNORECASE),
    "projects": re.compile(r"\bprojects?\b", re.IGNORECASE),
    "skills": re.compile(r"\btechnical skills?\b|\bskills?\b", re.IGNORECASE),
    "certifications": re.compile(r"\bcertifications?\b", re.IGNORECASE),
    "achievements": re.compile(r"\bachievements?\b|\bawards?\b|\bextra curricular activities\b", re.IGNORECASE),
}


@dataclass
class ParseResult:
    structured_data: dict
    confidence: float
    used_fallback_llm: bool


class ResumeParserService:
    def __init__(self) -> None:
        self.nlp = self._load_spacy_pipeline()
        self.llm_provider = ResumeLLMProvider()

    @staticmethod
    def _load_spacy_pipeline():
        try:
            import spacy
        except Exception:
            return None
        try:
            return spacy.load("en_core_web_sm")
        except Exception:
            return spacy.blank("en")

    def parse_resume(self, raw_text: str, confidence_threshold: float) -> ParseResult:
        regex_data = self._extract_regex(raw_text)
        ner_data = self._extract_ner(raw_text)
        section_data = self._detect_sections(raw_text)
        skills = extract_skills_from_text(raw_text)

        structured = {
            "name": ner_data.get("name"),
            "email": regex_data.get("email"),
            "phone": regex_data.get("phone"),
            "education": section_data.get("education", []),
            "experience": section_data.get("experience", []),
            "projects": section_data.get("projects", []),
            "skills": skills,
            "certifications": section_data.get("certifications", []),
            "achievements": section_data.get("achievements", []),
            "organizations": ner_data.get("organizations", []),
            "dates": ner_data.get("dates", []),
            "linkedin": regex_data.get("linkedin"),
            "github": regex_data.get("github"),
        }
        confidence = self._estimate_confidence(structured)

        if confidence >= confidence_threshold:
            return ParseResult(structured_data=structured, confidence=confidence, used_fallback_llm=False)

        llm_output = self.llm_provider.parse_resume(raw_text)
        if llm_output:
            merged = {**structured, **llm_output}
            return ParseResult(
                structured_data=merged,
                confidence=max(confidence, 0.75),
                used_fallback_llm=True,
            )
        return ParseResult(structured_data=structured, confidence=confidence, used_fallback_llm=False)

    def _extract_regex(self, raw_text: str) -> dict[str, str | None]:
        email = self._first_match(EMAIL_RE, raw_text)
        if not email:
            relaxed = EMAIL_RELAXED_RE.search(raw_text)
            if relaxed:
                email = f"{relaxed.group(1)}@{relaxed.group(2)}.{relaxed.group(3)}"
        return {
            "email": email,
            "phone": self._first_match(PHONE_RE, raw_text),
            "linkedin": self._normalize_profile_url(self._first_match(LINKEDIN_RE, raw_text), "linkedin"),
            "github": self._normalize_profile_url(self._first_match(GITHUB_RE, raw_text), "github"),
        }

    @staticmethod
    def _first_match(pattern: re.Pattern, content: str) -> str | None:
        match = pattern.search(content)
        if not match:
            return None
        return match.group(1) if match.lastindex else match.group(0)

    def _extract_ner(self, raw_text: str) -> dict[str, str | list[str] | None]:
        if self.nlp is None:
            return {"name": None, "organizations": [], "dates": []}
        doc = self.nlp(raw_text)
        people = [self._clean_entity(ent.text) for ent in doc.ents if ent.label_ == "PERSON"]
        orgs = [self._clean_entity(ent.text) for ent in doc.ents if ent.label_ in {"ORG", "NORP"}]
        dates = [ent.text.strip() for ent in doc.ents if ent.label_ == "DATE"]
        people = [person for person in people if person]
        orgs = [org for org in orgs if self._is_valid_org(org)]
        return {
            "name": people[0] if people else None,
            "organizations": list(dict.fromkeys(orgs)),
            "dates": list(dict.fromkeys(dates)),
        }

    def _detect_sections(self, raw_text: str) -> dict[str, list[str]]:
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        sections: dict[str, list[str]] = {
            "education": [],
            "experience": [],
            "projects": [],
            "skills": [],
            "certifications": [],
            "achievements": [],
        }
        current_section: str | None = None
        for line in lines:
            found_section = self._detect_section_header(line)
            if found_section:
                current_section = found_section
                continue
            if current_section:
                sections[current_section].append(line)
        return sections

    @staticmethod
    def _detect_section_header(line: str) -> str | None:
        compact = re.sub(r"[\s:\-|]+", " ", line).strip()
        if len(compact) > 45:
            return None
        for section_key, pattern in SECTION_PATTERNS.items():
            if pattern.search(compact):
                return section_key
        return None

    @staticmethod
    def _normalize_profile_url(url: str | None, platform: str) -> str | None:
        if not url:
            return None
        cleaned = url.strip().rstrip(".,;")
        if cleaned.lower().startswith("http://") or cleaned.lower().startswith("https://"):
            return cleaned
        domain = "linkedin.com" if platform == "linkedin" else "github.com"
        if cleaned.lower().startswith("www.") or cleaned.lower().startswith(domain):
            return f"https://{cleaned}"
        return cleaned

    @staticmethod
    def _clean_entity(text: str) -> str:
        return " ".join(text.replace("\n", " ").split()).strip()

    @staticmethod
    def _is_valid_org(value: str) -> bool:
        if not value:
            return False
        if len(value) > 80:
            return False
        if re.search(r"\d{7,}", value):
            return False
        invalid_exact = {"linkedin", "github", "roman", "speech", "api", "faq"}
        return value.lower() not in invalid_exact

    @staticmethod
    def _estimate_confidence(structured: dict) -> float:
        score = 0.0
        if structured.get("email"):
            score += 0.2
        if structured.get("phone"):
            score += 0.15
        if structured.get("name"):
            score += 0.2
        if structured.get("skills"):
            score += 0.2
        if structured.get("experience"):
            score += 0.15
        if structured.get("education"):
            score += 0.1
        return min(score, 1.0)
