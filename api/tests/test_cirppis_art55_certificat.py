from app.rules.cirppis_art55_certificat import (
    decide_certificate_completeness,
    decide_net_amount_consistency,
)
from app.rules.engine import Abstention, Decision

COMPLETE_FACTS = {
    "supplier_name": "Karim Jlassi",
    "supplier_address": "12 rue de Marseille, Tunis",
    "amount_incl_tax": "1190.000",
    "withholding_amount": "15.000",
    "amount_net_paid": "1175.000",
}


def test_completeness_decides_complet_when_every_element_is_present() -> None:
    outcome = decide_certificate_completeness(COMPLETE_FACTS)

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART55_CERTIFICAT_COMPLET"


def test_completeness_abstains_naming_the_first_missing_element() -> None:
    facts = {
        key: value for key, value in COMPLETE_FACTS.items() if key != "supplier_address"
    }

    outcome = decide_certificate_completeness(facts)

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "supplier_address"


def test_completeness_abstains_on_an_entirely_empty_document() -> None:
    outcome = decide_certificate_completeness({})

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "supplier_name"


def test_net_consistency_decides_coherent_when_arithmetic_matches() -> None:
    outcome = decide_net_amount_consistency(COMPLETE_FACTS)

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART55_NET_COHERENT"


def test_net_consistency_decides_incoherent_when_arithmetic_does_not_match() -> None:
    facts = {**COMPLETE_FACTS, "amount_net_paid": "1000.000"}

    outcome = decide_net_amount_consistency(facts)

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART55_NET_INCOHERENT"


def test_net_consistency_abstains_when_withholding_amount_is_missing() -> None:
    facts = {
        key: value
        for key, value in COMPLETE_FACTS.items()
        if key != "withholding_amount"
    }

    outcome = decide_net_amount_consistency(facts)

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "withholding_amount"


def test_net_consistency_abstains_on_an_unparsable_amount() -> None:
    facts = {**COMPLETE_FACTS, "amount_net_paid": "not a number"}

    outcome = decide_net_amount_consistency(facts)

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "amount_net_paid"
