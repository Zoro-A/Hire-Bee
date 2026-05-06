import json
import re
import urllib.error
import urllib.parse
import urllib.request

from app.core.config import get_settings

JUDGE_PROMPT = """You are an expert CV evaluator for hiring research.
Input includes:
1) conversation_messages_json: full Q&A between assistant and candidate
2) generated_cv_json: CV content to evaluate

Score from 0-100 for:
- faithfulness: how accurately CV reflects Q&A facts
- relevance: fit for role direction implied by conversation
- professionalism: clarity, tone, grammar, ATS readability
- completeness: includes core sections and concrete details
- impact: uses outcomes/metrics and strong accomplishment framing

Return ONLY JSON with this exact schema:
{
  "overall": number,
  "faithfulness": number,
  "relevance": number,
  "professionalism": number,
  "completeness": number,
  "impact": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."]
}
"""


def _extract_json(text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("Gemini response did not include JSON")
    payload = json.loads(match.group(0))
    return payload


def evaluate_cv_with_gemini(messages: list[dict], cv_json: dict) -> tuple[dict, str]:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    model = settings.gemini_model
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?"
        f"key={urllib.parse.quote_plus(settings.gemini_api_key)}"
    )
    body = {
        "contents": [
            {
                "parts": [
                    {"text": JUDGE_PROMPT},
                    {"text": f"conversation_messages_json:\n{json.dumps(messages, ensure_ascii=True)}"},
                    {"text": f"generated_cv_json:\n{json.dumps(cv_json, ensure_ascii=True)}"},
                ]
            }
        ],
        "generationConfig": {"temperature": 0.1},
    }
    req = urllib.request.Request(
        url=url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=35) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Gemini judge request failed: {exc.code} {detail}") from exc
    except Exception as exc:
        raise RuntimeError(f"Gemini judge request failed: {exc}") from exc

    text = ""
    for cand in raw.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            if isinstance(part, dict) and isinstance(part.get("text"), str):
                text += part["text"]
    if not text.strip():
        raise RuntimeError("Gemini judge returned empty output.")
    return _extract_json(text), model
