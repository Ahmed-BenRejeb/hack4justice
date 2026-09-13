from app.rules.engine import Abstention, Decision, Facts
from app.rules.withholding_code_proposal import propose_withholding_code

MODEL_FACTS = ("payment_category", "beneficiary_fiscal_regime")

HONORAIRES_FORFAIT = """
FACTURE N. 2026-0501
Prestataire: Karim Jlassi, consultant independant
Regime fiscal du prestataire: forfait d'assiette (BNC)
Designation: Honoraires de conseil en gestion
Montant HT: 800.000 TND
"""

HONORAIRES_REEL = """
FACTURE N. 2026-0502
Prestataire: Cabinet Ben Ammar, expert-comptable
Regime fiscal du prestataire: regime reel (BNC)
Designation: Honoraires d'expertise comptable
Montant HT: 2 500.000 TND
"""

HONORAIRES_REGIME_UNSTATED = """
FACTURE N. 2026-0503
Designation: Honoraires de consultation juridique
Montant HT: 1 200.000 TND
"""

RENT_INVOICE = """
QUITTANCE DE LOYER N. 2026-0044
Loyer mensuel du local commercial, avenue Habib Bourguiba, Tunis.
Montant: 1 500.000 TND
"""


def _facts(text: str, **model_values: str) -> Facts:
    """Facts as rules receive them at upload: the category and regime are model-supplied."""
    return Facts(
        {"full_text": text, **model_values},
        model_confidences={
            name: 0.9 if name in model_values else None for name in MODEL_FACTS
        },
        threshold=0.5,
    )


def test_proposes_rs2_000001_for_honoraires_under_forfait_regime() -> None:
    outcome = propose_withholding_code(
        _facts(
            HONORAIRES_FORFAIT,
            payment_category="honoraires",
            beneficiary_fiscal_regime="forfait",
        )
    )

    assert isinstance(outcome, Decision)
    assert outcome.code == "RS2_000001"
    assert [(step.fact, step.source) for step in outcome.trace] == [
        ("full_text", "document"),
        ("payment_category", "model"),
        ("beneficiary_fiscal_regime", "model"),
    ]


def test_proposes_rs2_000002_for_honoraires_under_regime_reel() -> None:
    outcome = propose_withholding_code(
        _facts(
            HONORAIRES_REEL,
            payment_category="honoraires",
            beneficiary_fiscal_regime="reel",
        )
    )

    assert isinstance(outcome, Decision)
    assert outcome.code == "RS2_000002"


def test_abstains_when_fiscal_regime_is_not_stated() -> None:
    outcome = propose_withholding_code(
        _facts(HONORAIRES_REGIME_UNSTATED, payment_category="honoraires")
    )

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "beneficiary_fiscal_regime"
    assert outcome.trace[-1].value is None


def test_abstains_for_a_category_outside_this_narrow_scope() -> None:
    outcome = propose_withholding_code(_facts(RENT_INVOICE, payment_category="loyer"))

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "payment_category"


def test_abstains_when_payment_category_is_absent() -> None:
    outcome = propose_withholding_code(_facts(RENT_INVOICE))

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "payment_category"


def test_abstains_when_full_text_is_missing() -> None:
    outcome = propose_withholding_code(Facts())

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "full_text"
