from app.rules.cirppis_art55_certificat import (
    NET_AMOUNTS,
    decide_certificate_completeness,
    decide_net_amount_consistency,
)
from app.rules.engine import Abstention, Decision, Facts

MODEL_FACTS = (
    "supplier_name",
    "supplier_address",
    "amount_incl_tax",
    "withholding_amount",
    "amount_net_paid",
)

COMPLETE_VALUES = {
    "supplier_name": "Karim Jlassi",
    "supplier_address": "12 rue de Marseille, Tunis",
    "amount_incl_tax": "1190.000",
    "withholding_amount": "15.000",
    "amount_net_paid": "1175.000",
}


def _facts(values: dict[str, str]) -> Facts:
    """Facts as rules receive them at upload: every Article 55 element is model-supplied."""
    return Facts(
        values,
        model_confidences={
            name: 0.9 if name in values else None for name in MODEL_FACTS
        },
        threshold=0.5,
    )


def _without(field_name: str) -> dict[str, str]:
    return {key: value for key, value in COMPLETE_VALUES.items() if key != field_name}


def test_completeness_decides_complet_when_every_element_is_present() -> None:
    outcome = decide_certificate_completeness(_facts(COMPLETE_VALUES))

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART55_CERTIFICAT_COMPLET"
    assert [step.fact for step in outcome.trace] == list(MODEL_FACTS)
    assert all(step.source == "model" for step in outcome.trace)


def test_completeness_abstains_naming_the_first_missing_element() -> None:
    outcome = decide_certificate_completeness(_facts(_without("supplier_address")))

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "supplier_address"
    assert [step.fact for step in outcome.trace] == ["supplier_name", "supplier_address"]
    assert outcome.trace[-1].value is None


def test_completeness_abstains_on_an_entirely_empty_document() -> None:
    outcome = decide_certificate_completeness(_facts({}))

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "supplier_name"


def test_net_consistency_decides_coherent_when_arithmetic_matches() -> None:
    outcome = decide_net_amount_consistency(_facts(COMPLETE_VALUES))

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART55_NET_COHERENT"
    assert [step.fact for step in outcome.trace] == list(NET_AMOUNTS)


def test_net_consistency_decides_incoherent_when_arithmetic_does_not_match() -> None:
    outcome = decide_net_amount_consistency(
        _facts({**COMPLETE_VALUES, "amount_net_paid": "1000.000"})
    )

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART55_NET_INCOHERENT"


def test_net_consistency_abstains_when_withholding_amount_is_missing() -> None:
    outcome = decide_net_amount_consistency(_facts(_without("withholding_amount")))

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "withholding_amount"


def test_net_consistency_abstains_on_an_unparsable_amount() -> None:
    outcome = decide_net_amount_consistency(
        _facts({**COMPLETE_VALUES, "amount_net_paid": "not a number"})
    )

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "amount_net_paid"
