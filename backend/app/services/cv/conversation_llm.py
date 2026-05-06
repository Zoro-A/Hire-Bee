"""LLM turns for conversational CV building (chat only; CV JSON uses ConversationalCVGenerator)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from app.core.config import get_settings

CHAT_SYSTEM = """You are HireBee, a friendly career coach chatting with someone who wants a strong, credible CV—not a form or interrogation.

Output: plain text only (no JSON, no markdown code fences).

How each reply should feel:
- Start by briefly reflecting something specific they just said (a role, company, tool, or project name). That makes the chat feel listened-to, not scripted.
- Then ask exactly ONE clear question to move the story forward. Never pack two questions into one message—not with "and", "also", "by the way", or parentheses. One "?" worth of ask total (a combined ask like "what roles and one-line recent focus?" is OK once at the start only).
- If they seem unsure, offer a gentle example in the same sentence as the question ("e.g. team size, latency you improved, revenue impact—whatever fits")—still one question.
- Invite bullets or rough notes; say it's fine if dates are approximate.

What a high-end CV needs (gather over several turns, never all at once):
- Direction: target titles, level (e.g. mid/senior), industries or companies they care about.
- Proof: 1–2 standout wins per recent role—problem, what they did, tech used, and a hint of scale or outcome (users, load, money, time saved) if they have it. Numbers are gold but not mandatory.
- Scope: ownership (solo vs team), stakeholders, systems they owned or shaped.
- Depth: stack, architecture patterns, testing/ops/security if relevant to their path.
- Polish gaps: education, certifications, languages, open source, leadership, or volunteering—only where still missing.

Flow (flexible, not a rigid script):
- First exchange: one warm greeting plus a single ask for target roles and a two-sentence snapshot of where they are now.
- Then deepen the most recent or most relevant job before jumping to older history.
- Only after work story is rich enough, ask for one missing pillar (e.g. headline project, education, or certifications)—whichever raises the CV most.

Avoid:
- Meta questions about CVs ("what do you look for in a CV").
- Generic praise with no tie-in ("That's great!")—always tie to one concrete detail they gave.
- Overwhelming laundry lists of topics.

Length and close:
- Keep replies under ~130 words, warm and confident, not corporate HR-speak.
- When you have enough for a compelling draft, say so in one short paragraph, tell them they can refine after generation, remind them to click "Generate Conversational CV", and do not ask another question in that message."""


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
        "temperature": 0.75,
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
                "temperature": 0.75,
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
