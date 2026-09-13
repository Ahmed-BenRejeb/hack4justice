"""Deterministic rules for Code de l'IRPP et de l'IS, Article 55, paragraph I:
the withholding certificate's required contents.

Verbatim (corpus/sources/cirppis-retenues-a-la-source.txt:641-646): "Ce
certificat comporte : - l'identite et adresse du beneficiaire ; - le
montant brut qui lui est paye ; - le montant de la retenue a la source ;
- le montant net qui lui est paye." Verified 2026-09-13, docs/facts.md
(docs/decision-log.md D-029, D-030).

Two rules, not one, because they ground differently: completeness is a
literal reading of the enumeration; the net/brut/retenue equality is one
inference step from it (the three amounts appear together on one
certificate, so they must be mutually consistent), flagged as such in
docs/facts.md so the reviewer signs the inference, not just the text.

Neither rule computes montant_retenue from a rate and a base: which base
(HT or TTC) the withholding applies to has no citation anywhere in this
repo (docs/decision-log.md D-030) and is not asserted here.

All facts read here are extracted once, at upload, by
app/extraction/fields.py:extract_document_fields().
"""

from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from app.rules.engine import Abstention, Decision, RuleOutcome

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


def decide_certificate_completeness(facts: dict[str, str]) -> RuleOutcome:
    """Decide ART55_CERTIFICAT_COMPLET if every element Article 55(I)
    requires was extracted, or abstain naming the first one that was not.

    A fact absent from `facts` may mean the document does not state it, or
    that extraction could not read it; this rule cannot tell the two
    apart, so it never decides "incomplete", only "complete" or abstains
    naming the specific missing element (root CLAUDE.md design law:
    never guess).
    """
    for field_name, _description in REQUIRED_CONTENTS:
        if not facts.get(field_name, "").strip():
            return Abstention(missing_fact=field_name)
    return Decision(code="ART55_CERTIFICAT_COMPLET")


def _to_millimes(raw: str) -> Decimal | None:
    try:
        return Decimal(raw).quantize(MILLIME, rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        return None


def decide_net_amount_consistency(facts: dict[str, str]) -> RuleOutcome:
    """Decide whether montant_net = montant_brut - montant_retenue, at
    millime precision, using the three amounts a certificate must state
    per Article 55(I).

    Facts required: "amount_incl_tax" (montant brut), "withholding_amount"
    (montant retenue), and "amount_net_paid" (montant net). Abstains
    naming whichever is missing or unparsable as a decimal amount.
    """
    for field_name in ("amount_incl_tax", "withholding_amount", "amount_net_paid"):
        if not facts.get(field_name, "").strip():
            return Abstention(missing_fact=field_name)

    brut = _to_millimes(facts["amount_incl_tax"])
    retenue = _to_millimes(facts["withholding_amount"])
    net = _to_millimes(facts["amount_net_paid"])
    if brut is None:
        return Abstention(missing_fact="amount_incl_tax")
    if retenue is None:
        return Abstention(missing_fact="withholding_amount")
    if net is None:
        return Abstention(missing_fact="amount_net_paid")

    if net == brut - retenue:
        return Decision(code="ART55_NET_COHERENT")
    return Decision(code="ART55_NET_INCOHERENT")
