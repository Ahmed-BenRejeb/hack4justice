"""Projects a document's extracted facts into a pre-filled TEJ export draft.

Pure projection, no new table: app/rules/service.py:evaluate_all_rules()
already reads only Extraction rows, so a stored certificate would be
invisible to every rule and would only ever serve this one projection
(docs/decision-log.md D-029). Nothing here is computed that was not read:
a field the extraction pipeline could not read stays null, never
calculated from other fields (the withholding-base question is an
unresolved citation, see rules/CLAUDE.md equivalent note in
docs/decision-log.md D-030). The officer supplies whatever is null
(D-008: the officer decides and is responsible; this only saves retyping
what the document already states).
"""

import re
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.db.models import Citation, Document, Extraction, Finding, Rule

# The registered rule whose decided_code is a TEJ operation code (D-029, D-030).
CODE_PROPOSAL_RULE_CODE = "CIRPPIS-ART52-I-A-CODE"


@dataclass(frozen=True)
class ExportDraftValues:
    """Officer units throughout: dinars as decimal strings, no millimes.

    web/lib/tej.ts stays the sole dinars-to-millimes conversion boundary;
    the backend never produces millimes outside app/export/tej.py.
    """

    declarant_matricule_fiscal: str | None
    beneficiary_name: str | None
    beneficiary_matricule_fiscal: str | None
    beneficiary_address: str | None
    invoice_year: str | None
    code: str | None
    rate: str | None
    amount_excl_tax: str | None
    amount_vat: str | None
    amount_incl_tax: str | None
    amount_withheld: str | None
    amount_net_paid: str | None
    reference: str | None


@dataclass(frozen=True)
class ExportDraft:
    values: ExportDraftValues
    derived_fields: list[str]


_YEAR_PATTERN = re.compile(r"(?:19|20)\d{2}")


def _invoice_year(invoice_date: str | None) -> str | None:
    """A best-effort calendar year out of a free-form invoice date string.

    invoice_date is read as written on the document, in no fixed format, so
    this searches the string as written, separators included: a date's own
    separators ("/", "-", ".") keep the day and month digits from bleeding
    into a false match, which stripping them first would not (a stripped
    "12/03/2026" reads as "12032026", where "2032" at offset 1 is a false
    4-digit match found before the real "2026").
    """
    if not invoice_date:
        return None
    match = _YEAR_PATTERN.search(invoice_date)
    return match.group(0) if match else None


def derive_export_draft(db: Session, document: Document) -> ExportDraft:
    """Build a pre-filled export draft from a document's Extraction rows.

    Works for a document with no extractions at all: every field is then
    null except the declarant matricule (the filing organisation's own tax
    id, not extracted from the document), and derived_fields is a subset.
    """
    extractions = {
        extraction.field_name: extraction.value
        for extraction in db.query(Extraction).filter_by(document_id=document.id).all()
    }

    decided_code = (
        db.query(Finding.decided_code)
        .join(Citation, Citation.finding_id == Finding.id)
        .join(Rule, Rule.id == Citation.rule_id)
        .filter(
            Finding.document_id == document.id,
            Rule.code == CODE_PROPOSAL_RULE_CODE,
            Finding.status == "decided",
        )
        .order_by(Finding.created_at.desc())
        .limit(1)
        .scalar()
    )

    values = ExportDraftValues(
        declarant_matricule_fiscal=document.organisation.tax_id,
        beneficiary_name=extractions.get("supplier_name"),
        beneficiary_matricule_fiscal=extractions.get("supplier_tax_id"),
        beneficiary_address=extractions.get("supplier_address"),
        invoice_year=_invoice_year(extractions.get("invoice_date")),
        code=decided_code,
        rate=extractions.get("withholding_rate"),
        amount_excl_tax=extractions.get("amount_excl_tax"),
        amount_vat=extractions.get("amount_vat"),
        amount_incl_tax=extractions.get("amount_incl_tax"),
        amount_withheld=extractions.get("withholding_amount"),
        amount_net_paid=extractions.get("amount_net_paid"),
        reference=extractions.get("invoice_reference"),
    )
    derived_fields = [
        field for field, value in values.__dict__.items() if value is not None
    ]
    return ExportDraft(values=values, derived_fields=derived_fields)
