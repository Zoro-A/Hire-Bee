SKILL_TAXONOMY = {
    "python": "python",
    "fastapi": "fastapi",
    "sql": "sql",
    "docker": "docker",
    "react": "react",
    "machine learning": "machine learning",
    "javascript": "javascript",
    "postgresql": "postgresql",
    "sqlalchemy": "sqlalchemy",
    "langchain": "langchain",
    "openai": "openai",
}

SKILL_ALIASES = {
    "js": "javascript",
    "node.js": "javascript",
    "nodejs": "javascript",
    "ml": "machine learning",
    "postgres": "postgresql",
}


def normalize_skill(raw_skill: str) -> str:
    skill = raw_skill.strip().lower()
    if not skill:
        return skill
    return SKILL_ALIASES.get(skill, skill)


def extract_skills_from_text(text: str) -> list[str]:
    lowered = text.lower()
    found: set[str] = set()
    for skill in SKILL_TAXONOMY:
        if skill in lowered:
            found.add(SKILL_TAXONOMY[skill])
    for alias, target in SKILL_ALIASES.items():
        if alias in lowered:
            found.add(target)
    return sorted(found)
