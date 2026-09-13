"""Assisted rule for Code de l'IRPP et de l'IS, Article 52, paragraph I(a):
withholding at source on honoraires, commissions, courtages, and loyers.

The rule never computes or asserts a withholding rate: Article 52's rates
carry many amendments and reduced-rate exceptions (root CLAUDE.md design
law forbids guessing at those). It only checks a narrower, safer question:
does this document describe a payment in a category Article 52 covers, and
if so, does the document mention any withholding at all. A missing mention
is escalated to a human, not treated as a violation.
"""

from app.providers.openrouter import extract_fact
from app.rules.engine import Abstention, Decision, RuleOutcome, TraceStep

CATEGORY_QUESTION = (
    "Does this document describe a payment for honoraires (professional "
    "fees), commissions, courtages (brokerage), or loyers (rent)? Answer "
    "with just the category name in French if one applies, or null if none "
    "of these apply."
)
CONFIDENCE_THRESHOLD = 0.5
WITHHOLDING_KEYWORD = "retenue"


def decide_article_52_withholding_mention(facts: dict[str, str]) -> RuleOutcome:
    """Decide whether a covered payment is missing any mention of withholding.

    Facts required: "full_text" (the document's extracted text). Asks the
    model whether the text describes an Article 52 category; abstains if it
    cannot tell. If it can, checks deterministically (no model call) whether
    the text also mentions withholding at all. Every outcome carries the
    steps that led to it (J1).
    """
    full_text = facts.get("full_text", "")
    text_step = TraceStep(fact="full_text", source="document", value=bool(full_text))
    if not full_text:
        return Abstention(missing_fact="full_text", trace=(text_step,))

    category = extract_fact(context=full_text, question=CATEGORY_QUESTION)
    category_step = TraceStep(
        fact="article_52_category",
        source="model",
        value=category.value,
        confidence=category.confidence,
        threshold=CONFIDENCE_THRESHOLD,
    )
    if category.value is None or category.confidence < CONFIDENCE_THRESHOLD:
        return Abstention(
            missing_fact="article_52_category", trace=(text_step, category_step)
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
