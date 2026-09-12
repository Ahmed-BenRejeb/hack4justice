from app.rules.engine import Abstention, Decision
from app.rules.withholding_code_proposal import propose_withholding_code

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


def test_proposes_rs2_000001_for_honoraires_under_forfait_regime() -> None:
    outcome = propose_withholding_code({"full_text": HONORAIRES_FORFAIT})

    assert isinstance(outcome, Decision)
    assert outcome.code == "RS2_000001"


def test_proposes_rs2_000002_for_honoraires_under_regime_reel() -> None:
    outcome = propose_withholding_code({"full_text": HONORAIRES_REEL})

    assert isinstance(outcome, Decision)
    assert outcome.code == "RS2_000002"


def test_abstains_when_fiscal_regime_is_not_stated() -> None:
    outcome = propose_withholding_code({"full_text": HONORAIRES_REGIME_UNSTATED})

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "beneficiary_fiscal_regime"


def test_abstains_for_a_category_outside_this_narrow_scope() -> None:
    outcome = propose_withholding_code({"full_text": RENT_INVOICE})

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "withholding_code_category"


def test_abstains_when_full_text_is_missing() -> None:
    outcome = propose_withholding_code({})

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "full_text"
