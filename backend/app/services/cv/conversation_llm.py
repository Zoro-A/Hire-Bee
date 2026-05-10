"""LLM turns for conversational CV building (chat only; CV JSON uses ConversationalCVGenerator)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from app.core.config import get_settings

CHAT_SYSTEM = """You are HireBee CV Coach. Your single job is to gather CV facts step-by-step and ask exactly ONE question per turn.

Output format:
- Plain text only (no JSON, no markdown).
- Keep each reply under 90 words.
- Ask exactly one question mark "?" per reply, except final completion message (no question).

Hard rules:
- Never invent employers, projects, tools, metrics, timelines, or names.
- Never mention companies like Meta (or any company) unless the user already mentioned them.
- Never ask two questions in one line.
- Never ask meta questions like "what do you look for in a CV".
- If user has typos, keep conversation smooth and continue.

Conversation style:
- Start with one short acknowledgement tied to user's last answer.
- Then ask one precise next question that extracts one missing CV field.
- If the user gives long text, ask the highest-value missing field next, not a broad follow-up.

Collection order (strict progression):
1) Target role + seniority.
2) Current/recent role summary (title, company, years).
3) One strongest project/achievement with impact.
4) Tech stack used in that work.
5) Education.
6) Certifications (if any).
7) Skills list cleanup (grouped, concise).
8) Optional extras (links, languages, awards) only if missing.

Completion behavior:
- When enough info exists for a solid CV draft, send a short completion message:
  "Great, I have enough to generate your CV draft. You can now click Generate Conversational CV. We can refine it after generation."
- Do not ask any question in completion message.
"""


def _map_to_lc_messages(messages: list[dict[str, str]]) -> list:
    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

    out: list = [SystemMessage(content=CHAT_SYSTEM)]
    for m in messages:
        role = (m.get("role") or "user").lower()
        content = (m.get("content") or "").strip()
        if not content:
            continue
        if role == "system":
            continue
        if role in ("assistant", "bot"):
            out.append(AIMessage(content=content))
        else:
            out.append(HumanMessage(content=content))
    return out


def _openai_chat(messages: list[dict[str, str]]) -> str:
    from langchain_openai import ChatOpenAI

    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set (required for conversation_llm_provider=openai).")

    llm = ChatOpenAI(api_key=settings.openai_api_key, model=settings.openai_model, temperature=0.35)
    lc_messages = _map_to_lc_messages(messages)
    response = llm.invoke(lc_messages)
    return (getattr(response, "content", "") or "").strip()


def _ollama_post_json(url: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _ollama_chat(messages: list[dict[str, str]]) -> str:
    """Call Ollama: try native /api/chat (with num_ctx etc.), then /v1/chat/completions.

    `ollama run` uses generate/streaming paths; some Windows setups handle the OpenAI shim
    more reliably than /api/chat. Model name must match `ollama list` (e.g. llama3.2:1b).
    """
    settings = get_settings()
    base = settings.ollama_base_url.rstrip("/")
    ollama_msgs: list[dict[str, str]] = [{"role": "system", "content": CHAT_SYSTEM}]
    for m in messages:
        role = (m.get("role") or "user").lower()
        content = (m.get("content") or "").strip()
        if not content or role == "system":
            continue
        ollama_msgs.append(
            {
                "role": "assistant" if role in ("assistant", "bot") else "user",
                "content": content,
            }
        )

    options: dict[str, int | float] = {
        "num_ctx": settings.ollama_chat_num_ctx,
        "num_predict": settings.ollama_chat_num_predict,
        "temperature": 0.35,
    }
    if settings.ollama_chat_num_gpu is not None:
        options["num_gpu"] = settings.ollama_chat_num_gpu

    failures: list[str] = []

    try:
        data = _ollama_post_json(
            f"{base}/api/chat",
            {
                "model": settings.ollama_chat_model,
                "messages": ollama_msgs,
                "stream": False,
                "options": options,
            },
        )
        text = (data.get("message") or {}).get("content", "").strip()
        if text:
            return text
        failures.append("/api/chat returned empty assistant content")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        failures.append(f"/api/chat HTTP {exc.code}: {detail[:1200]}")
    except urllib.error.URLError as exc:
        failures.append(f"/api/chat: {exc}")

    try:
        data = _ollama_post_json(
            f"{base}/v1/chat/completions",
            {
                "model": settings.ollama_chat_model,
                "messages": ollama_msgs,
                "stream": False,
                "temperature": 0.35,
                "max_tokens": settings.ollama_chat_num_predict,
            },
        )
        choices = data.get("choices") or []
        msg = (choices[0].get("message") or {}) if choices else {}
        text = (msg.get("content") or "").strip()
        if text:
            return text
        failures.append("/v1/chat/completions returned empty assistant content")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        failures.append(f"/v1/chat/completions HTTP {exc.code}: {detail[:1200]}")
    except urllib.error.URLError as exc:
        failures.append(f"/v1/chat/completions: {exc}")

    raise RuntimeError(
        "Ollama conversational chat failed (tried /api/chat then /v1/chat/completions). "
        f"Set OLLAMA_CHAT_MODEL to the exact tag from `ollama list` (e.g. llama3.2:1b). "
        f"Details: {' | '.join(failures)}"
    )


def conversation_reply(messages: list[dict[str, str]]) -> str:
    settings = get_settings()
    provider = (settings.conversation_llm_provider or "openai").strip().lower()
    if provider == "ollama":
        return _ollama_chat(messages)
    return _openai_chat(messages)
