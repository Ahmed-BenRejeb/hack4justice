import dataclasses

import pytest

from app.providers import openrouter


def test_complete_returns_a_real_text_reply() -> None:
    # Free-text instruction-following is not perfectly reliable even for a
    # trivial prompt (observed: "banana" vs "Fruit" across identical calls),
    # so this only asserts the round trip works, not exact wording.
    reply = openrouter.complete(
        "What color is the sky on a clear day? One word.", max_tokens=20
    )

    assert isinstance(reply, str)
    assert len(reply.strip()) > 0


def test_extract_fact_finds_the_answer_when_context_has_it() -> None:
    fact = openrouter.extract_fact(
        context="The supplier, Atelier Ben Salah, is registered under the forfaitaire regime.",
        question="What is the supplier's fiscal regime?",
    )

    assert fact.value is not None
    assert "forfaitaire" in fact.value.lower()
    assert fact.confidence > 0.5


def test_extract_fact_abstains_when_context_lacks_the_answer() -> None:
    fact = openrouter.extract_fact(
        context="Invoice number 4521, dated March 3rd, no other details.",
        question="What is the supplier's fiscal regime?",
    )

    assert fact.confidence < 0.5


def test_extract_fact_raises_when_the_model_returns_json_that_is_not_an_object(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Observed live: the model occasionally answers a bare JSON value instead of
    # the requested object, which must surface as the provider's own error.
    monkeypatch.setattr(
        openrouter,
        "_post",
        lambda payload: {"choices": [{"message": {"content": '["honoraires"]'}}]},
    )

    with pytest.raises(openrouter.OpenRouterError):
        openrouter.extract_fact(context="Facture d'honoraires.", question="Catégorie ?")


def test_a_message_with_an_unmasked_identifier_is_refused_unsent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail_if_sent(*args: object, **kwargs: object) -> None:
        raise AssertionError("the request must not be sent")

    monkeypatch.setattr(openrouter.httpx, "post", fail_if_sent)

    with pytest.raises(openrouter.OpenRouterError) as raised:
        openrouter.extract_fact(context="Fournisseur MF 1234567A", question="Régime ?")

    assert "MATRICULE" in str(raised.value)
    assert "1234567A" not in str(raised.value)


def test_complete_raises_on_an_invalid_model_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    bad_settings = dataclasses.replace(
        openrouter.settings, openrouter_model_id="not-a-real-model-id"
    )
    monkeypatch.setattr(openrouter, "settings", bad_settings)

    with pytest.raises(openrouter.OpenRouterError):
        openrouter.complete("hello", max_tokens=10)
