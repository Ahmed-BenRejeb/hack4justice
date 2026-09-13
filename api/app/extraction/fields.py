"""The fixed vocabulary of structured fiscal fields extracted from a document.

One multi-field model call (app/providers/openrouter.py:extract_fields())
answers every question below from the same masked text, so the amounts stay
mutually consistent. The model sees placeholders instead of identifiers; an
answer naming a placeholder is read back locally, so identifiers are
extracted without leaving the workstation (A1, D-046). Each field name mirrors
web/lib/labels.ts: a name introduced here without a label there breaks the
officer's field table.

Design law: this module only asks questions and normalises the model's
literal answers. It never decides whether a fact satisfies a rule; that
judgement stays in app/rules/ (root CLAUDE.md).
"""

import re
from collections.abc import Mapping
from dataclasses import dataclass

from app.extraction.masking import unmask
from app.providers.openrouter import AssistedFact, extract_fields

# Below this confidence a field is not recorded, so a rule needing it abstains;
# decision traces show it as the threshold of every model-supplied fact (J1).
FIELD_CONFIDENCE_THRESHOLD = 0.5

FIELD_QUESTIONS: dict[str, str] = {
    "supplier_name": (
        "What is the name (or company name) of the supplier or service "
        "provider being paid on this document? Answer with just the name."
    ),
    "supplier_tax_id": (
        "What is the supplier's or service provider's matricule fiscal "
        "(Tunisian tax identification number)? Answer with just the "
        "identifier as written."
    ),
    "supplier_address": (
        "What is the supplier's or service provider's address? Answer "
        "with just the address as written."
    ),
    "client_name": (
        "What is the name (or company name) of the client or payer on "
        "this document? Answer with just the name."
    ),
    "client_tax_id": (
        "What is the client's or payer's matricule fiscal (Tunisian tax "
        "identification number)? Answer with just the identifier as "
        "written."
    ),
    "service_description": (
        "What service, product, or reason for payment does this document "
        "describe? Answer with a short description."
    ),
    "invoice_date": (
        "What date is this document dated? Answer with just the date as written."
    ),
    "amount_excl_tax": (
        "What is the amount hors taxes (before tax, HT) on this document? "
        "Answer with just the number, as written."
    ),
    "amount_vat": (
        "What is the TVA (value-added tax) amount on this document? "
        "Answer with just the number, as written."
    ),
    "amount_incl_tax": (
        "What is the amount toutes taxes comprises (including tax, TTC) "
        "on this document? Answer with just the number, as written."
    ),
    "withholding_rate": (
        "What withholding tax rate (taux de retenue a la source) does "
        "this document state, if any? Answer with just the percentage, "
        "as written."
    ),
    "withholding_amount": (
        "What withholding tax amount (montant de la retenue a la source) "
        "does this document state, if any? Answer with just the number, "
        "as written."
    ),
    "amount_net_paid": (
        "What net amount paid (montant net servi, after withholding) "
        "does this document state, if any? Answer with just the number, "
        "as written."
    ),
    "invoice_reference": (
        "What invoice or document reference number does this document "
        "carry? Answer with just the reference."
    ),
    "payment_category": (
        "Does this document describe a payment for honoraires "
        "(professional fees), commissions, courtages (brokerage), or "
        "loyers (rent)? Answer with just the category name in French if "
        "one applies, or null if none of these apply."
    ),
    "beneficiary_fiscal_regime": (
        "Is the beneficiary of this payment described as being under the "
        "'forfait d'assiette' tax regime or the 'regime reel' (real/"
        "normal) tax regime? Answer with just 'forfait' or 'reel', or "
        "null if the document does not say."
    ),
}

# Fields left deliberately unextracted, and why: date_payement (Article 55(I)
# attaches the certificate to the payment date, which an invoice does not
# record; the officer supplies it); beneficiary email/phone, categorie
# PP/PM, resident, cnpc, p_charge (not reliably present on an invoice, and
# not judged by any rule); annee_facturation (derived from invoice_date's
# year, not asked separately).

_THOUSANDS_OR_DECIMAL = re.compile(r"[^\d,.\-]")


@dataclass(frozen=True)
class ExtractedField:
    """A field's normalised value and the confidence the model gave it.

    `raw_value` is the same answer before amount normalisation, as written on
    the document: `app/extraction/positions.py` matches this, not `value`,
    against the document's own words, since normalising to a canonical
    decimal ("1000.500") makes the text unrecognisable against a page that
    reads "1 000,500".
    """

    value: str
    raw_value: str
    confidence: float


def normalize_amount(raw: str) -> str | None:
    """Canonicalise a model-read amount to a plain decimal string, or None.

    Strips currency marks, spaces and thousands separators; accepts comma
    or point as the decimal separator. Returns None if nothing numeric
    survives, so a rule reading it can call Decimal() directly, and
    web/lib/tej.ts stays the sole dinars-to-millimes conversion boundary.
    """
    stripped = _THOUSANDS_OR_DECIMAL.sub("", raw)
    if not stripped:
        return None
    # A comma is the decimal separator only when it is the last separator seen;
    # otherwise (e.g. "1,000.500") it is a thousands separator, dropped.
    last_comma = stripped.rfind(",")
    last_dot = stripped.rfind(".")
    if last_comma > last_dot:
        stripped = (
            stripped[:last_comma].replace(",", "").replace(".", "")
            + "."
            + stripped[last_comma + 1 :]
        )
    else:
        stripped = stripped.replace(",", "")
    try:
        return str(float(stripped))
    except ValueError:
        return None


AMOUNT_FIELDS = frozenset(
    {
        "amount_excl_tax",
        "amount_vat",
        "amount_incl_tax",
        "withholding_amount",
        "amount_net_paid",
    }
)

# A percentage is numeric in the same sense an amount is (normalize_amount's
# strip-and-parse applies equally): the model reads it as written, "%" sign
# included ("1.5%"), which web/lib/tej.ts:formatRate() cannot parse.
NUMERIC_FIELDS = AMOUNT_FIELDS | {"withholding_rate"}


def _normalize(
    field_name: str, fact: AssistedFact, originals: Mapping[str, str]
) -> ExtractedField | None:
    if fact.value is None or fact.confidence < FIELD_CONFIDENCE_THRESHOLD:
        return None
    value = unmask(str(fact.value), originals).strip()
    if not value:
        return None
    if field_name in NUMERIC_FIELDS:
        normalized = normalize_amount(value)
        if normalized is None:
            return None
        return ExtractedField(
            value=normalized, raw_value=value, confidence=fact.confidence
        )
    return ExtractedField(value=value, raw_value=value, confidence=fact.confidence)


def extract_document_fields(
    masked_text: str, originals: Mapping[str, str]
) -> dict[str, ExtractedField]:
    """Extract every field in FIELD_QUESTIONS from one document's masked text.

    One live call (extract_fields()) that receives the masked text only;
    `originals` (from app/extraction/masking.py:mask_with_originals()) turns
    each placeholder in an answer back into its value. Fields below the
    confidence threshold, or with no answer, are absent from the result
    entirely, so a rule that needs one abstains naming it, rather than judging
    a guess.
    """
    if not masked_text.strip():
        return {}
    facts = extract_fields(context=masked_text, fields=FIELD_QUESTIONS)
    result: dict[str, ExtractedField] = {}
    for field_name, fact in facts.items():
        normalized = _normalize(field_name, fact, originals)
        if normalized is not None:
            result[field_name] = normalized
    return result
