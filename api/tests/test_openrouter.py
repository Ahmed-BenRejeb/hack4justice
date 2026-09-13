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


def test_extract_fields_answers_every_field_from_shared_context() -> None:
    facts = openrouter.extract_fields(
        context=(
            "Facture: Atelier Ben Salah, matricule fiscal 1234567A. "
            "Honoraires de conseil, montant HT 1000.000 TND."
        ),
        fields={
            "supplier_name": "What is the supplier's name?",
            "supplier_tax_id": "What is the supplier's matricule fiscal?",
            "invoice_date": "What date is this document dated?",
        },
    )

    assert set(facts) == {"supplier_name", "supplier_tax_id", "invoice_date"}
    assert facts["supplier_name"].value is not None
    assert "ben salah" in facts["supplier_name"].value.lower()
    assert facts["supplier_tax_id"].value is not None
    assert "1234567a" in facts["supplier_tax_id"].value.lower()
    # Not stated in the context: abstains with confidence 0, not a guess.
    assert facts["invoice_date"].confidence < 0.5


def test_complete_raises_on_an_invalid_model_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    bad_settings = dataclasses.replace(
        openrouter.settings, openrouter_model_id="not-a-real-model-id"
    )
    monkeypatch.setattr(openrouter, "settings", bad_settings)

    with pytest.raises(openrouter.OpenRouterError):
        openrouter.complete("hello", max_tokens=10)
