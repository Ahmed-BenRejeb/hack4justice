from app.rules.engine import Abstention, Decision
from app.rules.tej_matricule_format import decide_matricule_fiscal_format


def test_decides_valid_for_a_well_formed_matricule() -> None:
    outcome = decide_matricule_fiscal_format({"supplier_tax_id": "1234567A"})

    assert isinstance(outcome, Decision)
    assert outcome.code == "TEJ_MATRICULE_VALID"


def test_decides_valid_case_insensitively() -> None:
    outcome = decide_matricule_fiscal_format({"supplier_tax_id": "1234567a"})

    assert isinstance(outcome, Decision)
    assert outcome.code == "TEJ_MATRICULE_VALID"


def test_decides_invalid_for_a_malformed_matricule() -> None:
    outcome = decide_matricule_fiscal_format({"supplier_tax_id": "not-a-matricule"})

    assert isinstance(outcome, Decision)
    assert outcome.code == "TEJ_MATRICULE_INVALID"


def test_abstains_when_supplier_tax_id_is_missing() -> None:
    outcome = decide_matricule_fiscal_format({})

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "supplier_tax_id"
