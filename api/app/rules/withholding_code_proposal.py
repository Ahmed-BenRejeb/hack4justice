"""Proposes the DGI TEJ withholding code for a payment, with its citation.

This is docs/plan.md section 2's "technical core": selecting the correct
withholding-tax code among several dozen (see schemas/tej/SOURCE.md, D-019,
for the real 36-code enumeration this proposal draws from).

Deliberately narrow, per the root CLAUDE.md design law against guessing:
covers only the "honoraires, commissions, courtages" family (RS2_000001 vs
RS2_000002 in schemas/tej/TEJRSCodesOperations_v1.0.xsd), which is exactly
what Code de l'IRPP et de l'IS Article 52(I)(a) describes. Any other
category (loyers, capitaux mobiliers, valeurs mobilieres, cessions, and so
on) abstains by name rather than being force-fit into this family.
"""

from app.providers.openrouter import extract_fact
from app.rules.engine import Abstention, Decision, RuleOutcome

CATEGORY_QUESTION = (
    "Does this document describe a payment for honoraires (professional "
    "fees), commissions, or courtages (brokerage)? Answer with just the "
    "category name in French if one applies, or null if none of these "
    "apply (for example, if the payment is rent, dividends, or a sale of "
    "goods or property)."
)
REGIME_QUESTION = (
    "Is the beneficiary of this payment described as being under the "
    "'forfait d'assiette' tax regime or the 'regime reel' (real/normal) "
    "tax regime? Answer with just 'forfait' or 'reel', or null if the "
    "document does not say."
)
CONFIDENCE_THRESHOLD = 0.5

# Verbatim administrative descriptions, from schemas/tej/TEJRSCodesOperations_v1.0.xsd
# (see schemas/tej/SOURCE.md, D-019). Not paraphrased.
RS2_000001_DESCRIPTION = (
    "Honoraires servis aux BNC forfait d'assiette, commissions, courtages, "
    "remunerations des activites non commerciales qu'elle qu'en soit "
    "l'appellation servis a des residents etablis."
)
RS2_000002_DESCRIPTION = "Honoraires servis aux BNC regime reel residents etablis."


def propose_withholding_code(facts: dict[str, str]) -> RuleOutcome:
    """Propose RS2_000001 or RS2_000002 for an honoraires/commissions/
    courtages payment, or abstain naming the missing or out-of-scope fact.

    Facts required: "masked_text" (the document's masked text, the only text
    the model sees, A1).
    """
    masked_text = facts.get("masked_text", "")
    if not masked_text:
        return Abstention(missing_fact="masked_text")

    category = extract_fact(context=masked_text, question=CATEGORY_QUESTION)
    if category.value is None or category.confidence < CONFIDENCE_THRESHOLD:
        return Abstention(missing_fact="withholding_code_category")

    regime = extract_fact(context=masked_text, question=REGIME_QUESTION)
    if regime.value is None or regime.confidence < CONFIDENCE_THRESHOLD:
        return Abstention(missing_fact="beneficiary_fiscal_regime")

    normalized_regime = regime.value.strip().lower()
    if "forfait" in normalized_regime:
        return Decision(code="RS2_000001")
    if "reel" in normalized_regime or "réel" in normalized_regime:
        return Decision(code="RS2_000002")
    return Abstention(missing_fact="beneficiary_fiscal_regime")
