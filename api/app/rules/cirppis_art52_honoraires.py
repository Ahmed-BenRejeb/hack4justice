"""Assisted rule for Code de l'IRPP et de l'IS, Article 52, paragraph I(a):
withholding at source on honoraires, commissions, courtages, and loyers.

The rule never computes or asserts a withholding rate: Article 52's rates
carry many amendments and reduced-rate exceptions (root CLAUDE.md design
law forbids guessing at those). It only checks a narrower, safer question:
does this document describe a payment in a category Article 52 covers, and
if so, does the document mention any withholding at all. A missing mention
is escalated to a human, not treated as a violation.

The "payment_category" fact is supplied by the model at upload, from the
masked text (app/extraction/fields.py, docs/decision-log.md D-043), not by
this rule: a rule reads facts, it does not go fetch them.
"""

from app.rules.engine import Abstention, Decision, Facts, RuleOutcome, TraceStep

COVERED_CATEGORIES = ("honoraires", "commissions", "courtages", "loyers")
WITHHOLDING_KEYWORD = "retenue"


def decide_article_52_withholding_mention(facts: Facts) -> RuleOutcome:
    """Decide whether a covered payment is missing any mention of withholding.

    Facts required: "full_text" (the document's extracted text) and
    "payment_category" (supplied by the model, absent when it could not be
    established). Checks deterministically, without a model call, whether the
    text mentions withholding at all. Every outcome carries the steps that led
    to it (J1).
    """
    full_text = facts.get("full_text", "")
    text_step = TraceStep(fact="full_text", source="document", value=bool(full_text))
    if not full_text:
        return Abstention(missing_fact="full_text", trace=(text_step,))

    category_step = facts.step("payment_category")
    category = str(category_step.value or "").strip().lower()
    if not any(covered in category for covered in COVERED_CATEGORIES):
        return Abstention(
            missing_fact="payment_category", trace=(text_step, category_step)
        )

    mentioned = WITHHOLDING_KEYWORD in full_text.lower()
    trace = (
        text_step,
        category_step,
        TraceStep(fact="withholding_mention", source="document", value=mentioned),
    )
    if mentioned:
        return Decision(code="ART52_WITHHOLDING_PRESENT", trace=trace)
    return Decision(code="ART52_WITHHOLDING_MISSING", trace=trace)
