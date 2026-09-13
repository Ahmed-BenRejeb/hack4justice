"""Supplier facts a person confirmed, and the questions a person may answer (B3, B4, J4).

An abstention names the fact a rule could not establish. When that fact is a
property of the supplier, a person can answer it once and the answer applies
to every later file from the same supplier (J11), which is what makes an
abstention a question rather than a dead end.

Only supplier properties belong here. A transaction fact (what one invoice is
for) is deliberately not answerable this way: one supplier can invoice several
categories, so remembering the answer against the supplier would be wrong.

This module stores and reads answers. It never decides whether an answer
satisfies a rule; that judgement stays in app/rules/ (root CLAUDE.md).
"""

from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.db.models import SupplierFact

# Facts a person may confirm about a supplier, each with the values it accepts.
# A value outside its set is refused rather than stored, so a rule never reads
# an answer it has no branch for.
ANSWERABLE_FACTS: dict[str, tuple[str, ...]] = {
    "beneficiary_fiscal_regime": ("reel", "forfait"),
}


class UnanswerableFact(ValueError):
    """The fact is not one a person may confirm about a supplier."""


class UnacceptedValue(ValueError):
    """The value is not one the fact accepts."""


def accepted_values(fact_name: str) -> tuple[str, ...]:
    """The values a fact accepts, raising if it is not answerable at all."""
    if fact_name not in ANSWERABLE_FACTS:
        raise UnanswerableFact(
            f"{fact_name} is not a fact a person may confirm about a supplier; "
            f"answerable facts: {', '.join(sorted(ANSWERABLE_FACTS))}"
        )
    return ANSWERABLE_FACTS[fact_name]


def confirm_fact(
    db: Session,
    organisation_id: UUID,
    supplier_tax_id: str,
    fact_name: str,
    value: str,
    confirmed_by: str,
    valid_until: date | None = None,
) -> SupplierFact:
    """Record a person's answer about a supplier, replacing any earlier answer.

    Raises UnanswerableFact or UnacceptedValue rather than storing anything a
    rule could not read.
    """
    values = accepted_values(fact_name)
    if value not in values:
        raise UnacceptedValue(
            f"{value!r} is not an accepted value for {fact_name}; "
            f"accepted: {', '.join(values)}"
        )

    existing = (
        db.query(SupplierFact)
        .filter_by(
            organisation_id=organisation_id,
            supplier_tax_id=supplier_tax_id,
            fact_name=fact_name,
        )
        .one_or_none()
    )
    if existing is None:
        fact = SupplierFact(
            organisation_id=organisation_id,
            supplier_tax_id=supplier_tax_id,
            fact_name=fact_name,
            value=value,
            confirmed_by=confirmed_by,
            valid_until=valid_until,
        )
        db.add(fact)
    else:
        existing.value = value
        existing.confirmed_by = confirmed_by
        existing.valid_until = valid_until
        # A re-confirmation is a new confirmation: the date the trace shows moves with it.
        # now() is evaluated by the database, so every timestamp comes from one clock.
        existing.confirmed_at = func.now()
        fact = existing
    db.flush()
    db.refresh(fact)
    return fact


def current_facts(
    db: Session, organisation_id: UUID, supplier_tax_id: str, on_date: date
) -> dict[str, SupplierFact]:
    """Every confirmed fact about a supplier still valid on `on_date`, by fact name.

    An expired attestation is left out rather than applied, so the rule that
    needed it abstains again and asks for a current one.
    """
    rows = (
        db.query(SupplierFact)
        .filter_by(organisation_id=organisation_id, supplier_tax_id=supplier_tax_id)
        .all()
    )
    return {
        fact.fact_name: fact
        for fact in rows
        if fact.valid_until is None or fact.valid_until >= on_date
    }
