"""LLM turns for conversational CV building (chat only; CV JSON uses ConversationalCVGenerator)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from app.core.config import get_settings

CHAT_SYSTEM = """You are HireBee, a warm and concise career coach helping a candidate build their CV through natural conversation.

Rules:
- Reply in plain text only (no JSON, no markdown code fences).
- Ask at most ONE clear follow-up per message when you still need information.
- First, greet briefly and ask what roles they are targeting and a short overview of their background.
- Encourage them to share skills, work history, education, projects, certifications—anything relevant—in their own words.
- Keep each reply under 160 words. Sound human and conversational, not like a rigid form.
- When they have shared enough to draft a CV, remind them they can click "Generate Conversational CV" when ready."""


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

    llm = ChatOpenAI(api_key=settings.openai_api_key, model=settings.openai_model, temperature=0.75)
    lc_messages = _map_to_lc_messages(messages)
    response = llm.invoke(lc_messages)
    return (getattr(response, "content", "") or "").strip()


def _ollama_chat(messages: list[dict[str, str]]) -> str:
    settings = get_settings()
    url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
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
    body = json.dumps(
        {"model": settings.ollama_chat_model, "messages": ollama_msgs, "stream": False},
    ).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Ollama HTTP error: {exc.code} {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Could not reach Ollama at {url}: {exc}") from exc
    return (data.get("message") or {}).get("content", "").strip()


def conversation_reply(messages: list[dict[str, str]]) -> str:
    settings = get_settings()
    provider = (settings.conversation_llm_provider or "openai").strip().lower()
    if provider == "ollama":
        return _ollama_chat(messages)
    return _openai_chat(messages)
