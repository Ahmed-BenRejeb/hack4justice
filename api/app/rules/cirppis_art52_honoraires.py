"""Assisted rule for Code de l'IRPP et de l'IS, Article 52, paragraph I(a):
withholding at source on honoraires, commissions, courtages, and loyers.

The rule never computes or asserts a withholding rate: Article 52's rates
carry many amendments and reduced-rate exceptions (root CLAUDE.md design
law forbids guessing at those). It only checks a narrower, safer question:
does this document describe a payment in a category Article 52 covers, and
if so, does the document mention any withholding at all. A missing mention
is escalated to a human, not treated as a violation.

The "payment_category" fact is read at upload by
app/extraction/fields.py:extract_document_fields() (one shared model call
per document, docs/decision-log.md D-029), not by this rule: a rule reads
facts, it does not go fetch them.
"""

from app.rules.engine import Abstention, Decision, RuleOutcome

COVERED_CATEGORIES = ("honoraires", "commissions", "courtages", "loyers")
WITHHOLDING_KEYWORD = "retenue"


def decide_article_52_withholding_mention(facts: dict[str, str]) -> RuleOutcome:
    """Decide whether a covered payment is missing any mention of withholding.

    Facts required: "full_text" (the document's extracted text) and
    "payment_category" (the extracted payment category, empty or absent if
    the model could not establish one).
    """
    full_text = facts.get("full_text", "")
    if not full_text:
        return Abstention(missing_fact="full_text")

    category = facts.get("payment_category", "").strip().lower()
    if not category or not any(covered in category for covered in COVERED_CATEGORIES):
        return Abstention(missing_fact="payment_category")

    if WITHHOLDING_KEYWORD in full_text.lower():
        return Decision(code="ART52_WITHHOLDING_PRESENT")
    return Decision(code="ART52_WITHHOLDING_MISSING")
