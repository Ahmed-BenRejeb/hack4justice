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
"beneficiary_fiscal_regime") are supplied by the model at upload, from the
masked text (app/extraction/fields.py, docs/decision-log.md D-043): this
module never calls the model itself.
"""

from app.rules.engine import Abstention, Decision, Facts, RuleOutcome, TraceStep

COVERED_CATEGORIES = ("honoraires", "commissions", "courtages")

# Verbatim administrative descriptions, from schemas/tej/TEJRSCodesOperations_v1.0.xsd
# (see schemas/tej/SOURCE.md, D-019). Not paraphrased.
RS2_000001_DESCRIPTION = (
    "Honoraires servis aux BNC forfait d'assiette, commissions, courtages, "
    "remunerations des activites non commerciales qu'elle qu'en soit "
    "l'appellation servis a des residents etablis."
)
RS2_000002_DESCRIPTION = "Honoraires servis aux BNC regime reel residents etablis."


def propose_withholding_code(facts: Facts) -> RuleOutcome:
    """Propose RS2_000001 or RS2_000002 for an honoraires/commissions/
    courtages payment, or abstain naming the missing or out-of-scope fact.

    Facts required: "full_text", "payment_category", and
    "beneficiary_fiscal_regime" (the last two absent when the model could not
    establish them). Every outcome carries the steps that led to it (J1).
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

    regime_step = facts.step("beneficiary_fiscal_regime")
    regime = str(regime_step.value or "").strip().lower()
    trace = (text_step, category_step, regime_step)
    if "forfait" in regime:
        return Decision(code="RS2_000001", trace=trace)
    if "reel" in regime or "réel" in regime:
        return Decision(code="RS2_000002", trace=trace)
    return Abstention(missing_fact="beneficiary_fiscal_regime", trace=trace)
