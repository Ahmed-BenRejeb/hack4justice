"""Answering what a rule could not establish, so an abstention is a question, not a dead end.

An abstention names the fact it was missing (D-005). When that fact is a
property of the supplier, a person answers it here, the document's rules run
again, and the finding becomes a decision whose trace says the fact was
confirmed by that person (B4, J4). The answer is kept against the supplier, so
the same question is not asked again on their next file (B3, J11).

A person's answer never decides the outcome: it supplies a fact, and the
deterministic rule judges it, exactly as a model-supplied fact is judged (root
CLAUDE.md design law).
"""

import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.models import Document, Extraction
from app.db.session import get_db
from app.rules.service import reevaluate_document
from app.supplier.facts import (
    ANSWERABLE_FACTS,
    UnacceptedValue,
    UnanswerableFact,
    confirm_fact,
)

router = APIRouter(prefix="/documents", tags=["supplier facts"])


class AnswerableFactOut(BaseModel):
    """A fact a person may confirm about this document's supplier, and the values it accepts."""

    fact_name: str
    values: list[str]


class AnswerableFactsOut(BaseModel):
    """What can be answered for one document.

    `supplier_tax_id` is null when the supplier could not be identified: an
    answer has nothing to attach to then, and the interface says so rather
    than offering a question whose answer could not be kept.
    """

    supplier_tax_id: str | None
    facts: list[AnswerableFactOut]


class ConfirmFactIn(BaseModel):
    fact_name: str
    value: str
    confirmed_by: str = Field(min_length=1)
    # An attestation that expires: past this date the fact stops applying.
    valid_until: date | None = None


class SupplierFactOut(BaseModel):
    id: uuid.UUID
    supplier_tax_id: str
    fact_name: str
    value: str
    confirmed_by: str
    confirmed_at: datetime
    valid_until: date | None

    model_config = {"from_attributes": True}


def _supplier_tax_id(db: Session, document_id: uuid.UUID) -> str | None:
    extraction = (
        db.query(Extraction)
        .filter_by(document_id=document_id, field_name="supplier_tax_id")
        .one_or_none()
    )
    return extraction.value if extraction else None


@router.get("/{document_id}/answerable-facts", response_model=AnswerableFactsOut)
def get_answerable_facts(
    document_id: uuid.UUID, db: Session = Depends(get_db)
) -> AnswerableFactsOut:
    """The supplier facts a person may confirm for this document."""
    if db.get(Document, document_id) is None:
        raise HTTPException(status_code=404, detail="document not found")

    return AnswerableFactsOut(
        supplier_tax_id=_supplier_tax_id(db, document_id),
        facts=[
            AnswerableFactOut(fact_name=name, values=list(values))
            for name, values in sorted(ANSWERABLE_FACTS.items())
        ],
    )


@router.post(
    "/{document_id}/supplier-facts", response_model=SupplierFactOut, status_code=201
)
def confirm_supplier_fact(
    document_id: uuid.UUID, payload: ConfirmFactIn, db: Session = Depends(get_db)
) -> SupplierFactOut:
    """Record a person's answer about this document's supplier and re-run its rules."""
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="document not found")

    supplier_tax_id = _supplier_tax_id(db, document_id)
    if not supplier_tax_id:
        raise HTTPException(
            status_code=409,
            detail=(
                "the supplier of this document is not identified, so a fact "
                "cannot be recorded against them"
            ),
        )

    try:
        fact = confirm_fact(
            db,
            organisation_id=document.organisation_id,
            supplier_tax_id=supplier_tax_id,
            fact_name=payload.fact_name,
            value=payload.value,
            confirmed_by=payload.confirmed_by,
            valid_until=payload.valid_until,
        )
    except (UnanswerableFact, UnacceptedValue) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    reevaluate_document(db, document_id)
    db.commit()
    db.refresh(fact)
    return SupplierFactOut.model_validate(fact)
