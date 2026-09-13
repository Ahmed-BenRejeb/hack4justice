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

Both facts this rule reads ("payment_category" and
"beneficiary_fiscal_regime") are extracted once, at upload, by
app/extraction/fields.py:extract_document_fields() (docs/decision-log.md
D-029): this module no longer calls the model itself.
"""

from app.rules.engine import Abstention, Decision, RuleOutcome

COVERED_CATEGORIES = ("honoraires", "commissions", "courtages")

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

    Facts required: "full_text", "payment_category", and
    "beneficiary_fiscal_regime" (all absent or empty if the corresponding
    fact could not be established).
    """
    full_text = facts.get("full_text", "")
    if not full_text:
        return Abstention(missing_fact="full_text")

    category = facts.get("payment_category", "").strip().lower()
    if not category or not any(covered in category for covered in COVERED_CATEGORIES):
        return Abstention(missing_fact="payment_category")

    regime = facts.get("beneficiary_fiscal_regime", "").strip().lower()
    if not regime:
        return Abstention(missing_fact="beneficiary_fiscal_regime")

    if "forfait" in regime:
        return Decision(code="RS2_000001")
    if "reel" in regime or "réel" in regime:
        return Decision(code="RS2_000002")
    return Abstention(missing_fact="beneficiary_fiscal_regime")
