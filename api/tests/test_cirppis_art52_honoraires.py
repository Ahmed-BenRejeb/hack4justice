from app.rules.cirppis_art52_honoraires import decide_article_52_withholding_mention
from app.rules.engine import Abstention, Decision

HONORAIRES_INVOICE_WITH_WITHHOLDING = """
FACTURE N. 2026-0342
Designation: Prestation de service conseil (honoraires)
Montant HT: 1 000.000 TND
Taux de retenue a la source: 1.5%
Montant retenue: 15.000 TND
Montant TTC: 1 190.000 TND
"""

HONORAIRES_INVOICE_WITHOUT_WITHHOLDING = """
FACTURE N. 2026-0343
Designation: Honoraires de conseil juridique
Montant HT: 1 000.000 TND
Montant TTC: 1 190.000 TND
"""

UNRELATED_DOCUMENT = """
BON DE LIVRAISON N. 778
Livraison de fournitures de bureau: papier, stylos, classeurs.
Quantite: 40 unites.
"""


def test_decides_withholding_present_when_category_and_keyword_both_found() -> None:
    outcome = decide_article_52_withholding_mention(
        {
            "full_text": HONORAIRES_INVOICE_WITH_WITHHOLDING,
            "payment_category": "honoraires",
        }
    )

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART52_WITHHOLDING_PRESENT"


def test_decides_withholding_missing_when_category_found_but_no_keyword() -> None:
    outcome = decide_article_52_withholding_mention(
        {
            "full_text": HONORAIRES_INVOICE_WITHOUT_WITHHOLDING,
            "payment_category": "honoraires",
        }
    )

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART52_WITHHOLDING_MISSING"


def test_abstains_when_category_is_not_a_covered_one() -> None:
    outcome = decide_article_52_withholding_mention(
        {"full_text": UNRELATED_DOCUMENT, "payment_category": "vente de biens"}
    )

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "payment_category"


def test_abstains_when_payment_category_is_absent() -> None:
    outcome = decide_article_52_withholding_mention({"full_text": UNRELATED_DOCUMENT})

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "payment_category"


def test_abstains_when_full_text_is_missing() -> None:
    outcome = decide_article_52_withholding_mention({})

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "full_text"
