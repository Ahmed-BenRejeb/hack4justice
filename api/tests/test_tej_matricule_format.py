from app.rules.engine import Abstention, Decision, Facts
from app.rules.tej_matricule_format import decide_matricule_fiscal_format


def _facts(supplier_tax_id: str | None) -> Facts:
    """Facts as rules receive them at upload: supplier_tax_id is model-supplied."""
    values = {} if supplier_tax_id is None else {"supplier_tax_id": supplier_tax_id}
    confidence = None if supplier_tax_id is None else 0.9
    return Facts(
        values, model_confidences={"supplier_tax_id": confidence}, threshold=0.5
    )


def test_decides_valid_for_a_well_formed_matricule() -> None:
    outcome = decide_matricule_fiscal_format(_facts("1234567A"))

    assert isinstance(outcome, Decision)
    assert outcome.code == "TEJ_MATRICULE_VALID"
    [step] = outcome.trace
    assert (step.fact, step.source, step.value, step.confidence) == (
        "supplier_tax_id",
        "model",
        "1234567A",
        0.9,
    )


def test_decides_valid_case_insensitively() -> None:
    outcome = decide_matricule_fiscal_format(_facts("1234567a"))

    assert isinstance(outcome, Decision)
    assert outcome.code == "TEJ_MATRICULE_VALID"


def test_decides_invalid_for_a_malformed_matricule() -> None:
    outcome = decide_matricule_fiscal_format(_facts("not-a-matricule"))

    assert isinstance(outcome, Decision)
    assert outcome.code == "TEJ_MATRICULE_INVALID"


def test_abstains_when_supplier_tax_id_is_missing() -> None:
    outcome = decide_matricule_fiscal_format(_facts(None))

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "supplier_tax_id"
    assert outcome.trace[0].value is None
