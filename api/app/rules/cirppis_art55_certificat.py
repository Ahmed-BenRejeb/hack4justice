"""Deterministic rules for Code de l'IRPP et de l'IS, Article 55, paragraph I:
the withholding certificate's required contents.

Verbatim (DGI 2026 edition, PDF page 97): "Ce certificat comporte : -
l'identite et adresse du beneficiaire ; - le montant brut qui lui est paye ;
- le montant de la retenue a la source ; - le montant net qui lui est paye."
Verified 2026-09-13, docs/facts.md (docs/decision-log.md D-043, D-044).

Two rules, not one, because they ground differently: completeness is a
literal reading of the enumeration; the net/brut/retenue equality is one
inference step from it (the three amounts appear together on one
certificate, so they must be mutually consistent), flagged as such in
docs/facts.md so the reviewer signs the inference, not just the text.

Neither rule computes montant_retenue from a rate and a base: which base
(HT or TTC) the withholding applies to has no citation anywhere in this
repo (docs/decision-log.md D-044) and is not asserted here.

All facts read here are supplied by the model at upload, from the masked
text (app/extraction/fields.py:extract_document_fields()), and each outcome
traces them with their confidence (J1).
"""

from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from app.rules.engine import Abstention, Decision, Facts, RuleOutcome, TraceStep

MILLIME = Decimal("0.001")

# Article 55(I)'s enumeration, in the order it is stated. Each maps to the
# extraction field that carries it.
REQUIRED_CONTENTS = (
    ("supplier_name", "identite du beneficiaire"),
    ("supplier_address", "adresse du beneficiaire"),
    ("amount_incl_tax", "montant brut paye"),
    ("withholding_amount", "montant de la retenue a la source"),
    ("amount_net_paid", "montant net paye"),
)

# The three amounts the equality reads: montant brut, montant retenue, montant net.
NET_AMOUNTS = ("amount_incl_tax", "withholding_amount", "amount_net_paid")


def decide_certificate_completeness(facts: Facts) -> RuleOutcome:
    """Decide ART55_CERTIFICAT_COMPLET if every element Article 55(I)
    requires was extracted, or abstain naming the first one that was not.

    A fact absent from `facts` may mean the document does not state it, or
    that extraction could not read it; this rule cannot tell the two
    apart, so it never decides "incomplete", only "complete" or abstains
    naming the specific missing element (root CLAUDE.md design law:
    never guess). The trace lists each element checked, up to that one.
    """
    trace: list[TraceStep] = []
    for field_name, _description in REQUIRED_CONTENTS:
        step = facts.step(field_name)
        trace.append(step)
        if not str(step.value or "").strip():
            return Abstention(missing_fact=field_name, trace=tuple(trace))
    return Decision(code="ART55_CERTIFICAT_COMPLET", trace=tuple(trace))


def _to_millimes(raw: str) -> Decimal | None:
    try:
        return Decimal(raw.strip()).quantize(MILLIME, rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        return None


def decide_net_amount_consistency(facts: Facts) -> RuleOutcome:
    """Decide whether montant_net = montant_brut - montant_retenue, at
    millime precision, using the three amounts a certificate must state
    per Article 55(I).

    Facts required: "amount_incl_tax" (montant brut), "withholding_amount"
    (montant retenue), and "amount_net_paid" (montant net). Abstains
    naming the first one that is missing or not a decimal amount.
    """
    trace: list[TraceStep] = []
    amounts: list[Decimal] = []
    for field_name in NET_AMOUNTS:
        step = facts.step(field_name)
        trace.append(step)
        amount = _to_millimes(str(step.value)) if step.value else None
        if amount is None:
            return Abstention(missing_fact=field_name, trace=tuple(trace))
        amounts.append(amount)

    brut, retenue, net = amounts
    code = "ART55_NET_COHERENT" if net == brut - retenue else "ART55_NET_INCOHERENT"
    return Decision(code=code, trace=tuple(trace))
