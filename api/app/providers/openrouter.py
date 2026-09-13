"""The only module that imports an OpenRouter client or names a model id.

Used for fact extraction assistance, drafting, and explanation text. It
never decides whether a compliance finding exists (root CLAUDE.md design
law): callers get text or an assisted fact with a confidence score back,
and any judgment is made by deterministic rule code, not here.
"""

import json

import httpx

from app.config import settings

CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"
TIMEOUT_SECONDS = 30.0
DEFAULT_MAX_TOKENS = 500


class OpenRouterError(RuntimeError):
    pass


def _post(payload: dict) -> dict:
    response = httpx.post(
        CHAT_COMPLETIONS_URL,
        headers={"Authorization": f"Bearer {settings.openrouter_api_key}"},
        json={"model": settings.openrouter_model_id, **payload},
        timeout=TIMEOUT_SECONDS,
    )
    if response.status_code != 200:
        raise OpenRouterError(
            f"OpenRouter request failed: {response.status_code} {response.text}"
        )
    return response.json()


def _message_content(data: dict) -> str:
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as error:
        raise OpenRouterError(
            f"unexpected OpenRouter response shape: {data}"
        ) from error


def complete(
    prompt: str, system: str | None = None, max_tokens: int = DEFAULT_MAX_TOKENS
) -> str:
    """Send a single-turn prompt to the configured model, return its text reply."""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    data = _post({"messages": messages, "max_tokens": max_tokens})
    return _message_content(data)


ASSISTED_FACT_SYSTEM_PROMPT = (
    'Reply only with JSON: {"value": string or null, "confidence": number from 0 to 1}. '
    "Use null and confidence 0 if the context does not contain the answer. "
    "Never guess: a low-confidence answer is worse than admitting the context does not say."
)


class AssistedFact:
    def __init__(self, value: str | None, confidence: float) -> None:
        self.value = value
        self.confidence = confidence


def extract_fact(
    context: str, question: str, max_tokens: int = DEFAULT_MAX_TOKENS
) -> AssistedFact:
    """Ask the model to answer `question` from `context` alone, with a confidence.

    The model supplies a fact the document does not state outright; it never
    decides whether that fact satisfies a rule (root CLAUDE.md design law:
    assisted rules escalation, docs/plan.md section 4).
    """
    data = _post(
        {
            "messages": [
                {"role": "system", "content": ASSISTED_FACT_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Context: {context}\nQuestion: {question}",
                },
            ],
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }
    )
    content = _message_content(data)
    try:
        parsed = json.loads(content)
        return AssistedFact(
            value=parsed.get("value"), confidence=float(parsed.get("confidence", 0))
        )
    except (json.JSONDecodeError, TypeError, ValueError) as error:
        raise OpenRouterError(
            f"model did not return valid JSON: {content!r}"
        ) from error


ASSISTED_FIELDS_SYSTEM_PROMPT = (
    "Reply only with JSON: an object mapping each given field name to "
    '{"value": string or null, "confidence": number from 0 to 1}. Answer '
    "every field listed, in the same context. Use null and confidence 0 "
    "for any field the context does not state. Never guess: a low-"
    "confidence answer is worse than admitting the context does not say."
)
DEFAULT_FIELDS_MAX_TOKENS = 1500


def extract_fields(
    context: str, fields: dict[str, str], max_tokens: int = DEFAULT_FIELDS_MAX_TOKENS
) -> dict[str, AssistedFact]:
    """Ask the model to answer every question in `fields` from one shared context.

    One call answering several questions, not several single-question calls:
    the answers must come from one coherent reading of the same document (an
    invoice's HT, TVA, TTC, and withheld amounts are not independent facts),
    and a live upload cannot afford one round trip per field. Same design
    law as extract_fact(): the model supplies facts, it never judges them.
    A field missing from the reply, or with confidence 0, is treated the
    same as a null answer, not as an error.
    """
    questions = "\n".join(f"- {name}: {question}" for name, question in fields.items())
    data = _post(
        {
            "messages": [
                {"role": "system", "content": ASSISTED_FIELDS_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Context: {context}\n\nFields:\n{questions}",
                },
            ],
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }
    )
    content = _message_content(data)
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as error:
        raise OpenRouterError(
            f"model did not return valid JSON: {content!r}"
        ) from error

    result: dict[str, AssistedFact] = {}
    for name in fields:
        entry = parsed.get(name)
        if not isinstance(entry, dict):
            result[name] = AssistedFact(value=None, confidence=0.0)
            continue
        try:
            result[name] = AssistedFact(
                value=entry.get("value"), confidence=float(entry.get("confidence", 0))
            )
        except (TypeError, ValueError):
            result[name] = AssistedFact(value=None, confidence=0.0)
    return result
