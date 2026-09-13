from app.rules.cirppis_art52_honoraires import decide_article_52_withholding_mention
from app.rules.engine import Abstention, Decision, Facts, TraceStep

THRESHOLD = 0.5

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


def _facts(text: str, category: str | None, confidence: float = 0.9) -> Facts:
    """Facts as rules receive them at upload: payment_category is model-supplied."""
    values = {"full_text": text}
    if category is not None:
        values["payment_category"] = category
    return Facts(
        values,
        model_confidences={
            "payment_category": confidence if category is not None else None
        },
        threshold=THRESHOLD,
    )


def test_decides_withholding_present_when_category_and_keyword_both_found() -> None:
    outcome = decide_article_52_withholding_mention(
        _facts(HONORAIRES_INVOICE_WITH_WITHHOLDING, "honoraires")
    )

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART52_WITHHOLDING_PRESENT"
    assert outcome.trace[-1] == TraceStep(
        fact="withholding_mention", source="document", value=True
    )


def test_decides_withholding_missing_and_traces_the_model_fact_with_its_confidence() -> (
    None
):
    outcome = decide_article_52_withholding_mention(
        _facts(HONORAIRES_INVOICE_WITHOUT_WITHHOLDING, "honoraires", confidence=0.86)
    )

    assert isinstance(outcome, Decision)
    assert outcome.code == "ART52_WITHHOLDING_MISSING"
    assert outcome.trace == (
        TraceStep(fact="full_text", source="document", value=True),
        TraceStep(
            fact="payment_category",
            source="model",
            value="honoraires",
            confidence=0.86,
            threshold=THRESHOLD,
        ),
        TraceStep(fact="withholding_mention", source="document", value=False),
    )


def test_abstains_when_category_is_not_a_covered_one() -> None:
    outcome = decide_article_52_withholding_mention(
        _facts(UNRELATED_DOCUMENT, "vente de biens")
    )

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "payment_category"
    # The trace stops at the fact the rule could not accept.
    assert [step.fact for step in outcome.trace] == ["full_text", "payment_category"]
    assert outcome.trace[-1].value == "vente de biens"


def test_abstains_when_payment_category_is_absent() -> None:
    outcome = decide_article_52_withholding_mention(_facts(UNRELATED_DOCUMENT, None))

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "payment_category"
    assert outcome.trace[-1] == TraceStep(
        fact="payment_category",
        source="model",
        value=None,
        confidence=None,
        threshold=THRESHOLD,
    )


def test_abstains_when_full_text_is_missing() -> None:
    outcome = decide_article_52_withholding_mention(Facts())

    assert isinstance(outcome, Abstention)
    assert outcome.missing_fact == "full_text"
    assert outcome.trace == (
        TraceStep(fact="full_text", source="document", value=False),
    )
