from copy import deepcopy

ATS_TEMPLATE_ID = "ats_classic_v1"

ATS_SECTION_LIBRARY = [
    {"key": "summary", "label": "Professional Summary", "is_optional": False},
    {"key": "experience", "label": "Professional Experience", "is_optional": False},
    {"key": "education", "label": "Education", "is_optional": False},
    {"key": "projects", "label": "Projects", "is_optional": True},
    {"key": "skills", "label": "Skills", "is_optional": False},
    {"key": "certifications", "label": "Certifications", "is_optional": True},
    {"key": "achievements", "label": "Achievements", "is_optional": True},
    {"key": "extracurricular", "label": "Extra Curricular Activities", "is_optional": True},
    {"key": "awards", "label": "Awards", "is_optional": True},
    {"key": "interests", "label": "Interests", "is_optional": True},
]

DEFAULT_SECTION_ORDER = [section["key"] for section in ATS_SECTION_LIBRARY]


def build_empty_template(title: str = "ATS Resume") -> dict:
    return {
        "template_id": ATS_TEMPLATE_ID,
        "title": title,
        "header": {
            "name": "",
            "email": "",
            "phone": "",
            "location": "",
            "linkedin": "",
            "github": "",
        },
        "section_order": deepcopy(DEFAULT_SECTION_ORDER),
        "sections": {
            "summary": "",
            "experience": [],
            "education": [],
            "projects": [],
            "skills": [],
            "certifications": [],
            "achievements": [],
            "extracurricular": [],
            "awards": [],
            "interests": [],
        },
    }


def ensure_template_shape(cv_json: dict) -> dict:
    if "sections" not in cv_json or "section_order" not in cv_json:
        fallback = build_empty_template(title=cv_json.get("title", "ATS Resume"))
        sections = fallback["sections"]
        sections.update(
            {
                "summary": cv_json.get("summary", ""),
                "experience": cv_json.get("experience", []),
                "education": cv_json.get("education", []),
                "projects": cv_json.get("projects", []),
                "skills": cv_json.get("skills", []),
                "certifications": cv_json.get("certifications", []),
                "achievements": cv_json.get("achievements", []),
            }
        )
        fallback["header"].update(cv_json.get("personal_information", {}))
        return fallback

    normalized = deepcopy(cv_json)
    normalized.setdefault("template_id", ATS_TEMPLATE_ID)
    normalized.setdefault("header", {})
    normalized.setdefault("sections", {})
    normalized.setdefault("section_order", deepcopy(DEFAULT_SECTION_ORDER))

    for section in DEFAULT_SECTION_ORDER:
        normalized["sections"].setdefault(section, [] if section != "summary" else "")

    # Keep order unique and include any custom sections at the end.
    seen = set()
    cleaned_order: list[str] = []
    for section in normalized["section_order"]:
        if section not in seen:
            cleaned_order.append(section)
            seen.add(section)
    for section in normalized["sections"].keys():
        if section not in seen:
            cleaned_order.append(section)
            seen.add(section)
    normalized["section_order"] = cleaned_order
    return normalized
