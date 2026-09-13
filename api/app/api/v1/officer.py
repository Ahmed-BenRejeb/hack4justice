"""Officer queue and decision endpoints.

The officer validates or flags a pre-qualified file; the system never
decides on its own authority (D-008). A decision is the one terminal,
human-authority step before export, so a document accepts at most one.
"""

import uuid
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Document, Finding, OfficerDecision
from app.db.session import get_db

router = APIRouter(prefix="/officer", tags=["officer"])


class QueuedDocumentOut(BaseModel):
    """One file awaiting review, with what an officer needs to scan the list."""

    id: uuid.UUID
    organisation_id: uuid.UUID
    organisation_name: str
    uploaded_by: str
    filename: str
    status: str
    created_at: datetime
    decided_count: int
    abstained_count: int


@router.get("/queue", response_model=list[QueuedDocumentOut])
def get_queue(db: Session = Depends(get_db)) -> list[QueuedDocumentOut]:
    """Extracted documents that do not yet have an officer decision, oldest first."""
    decided_document_ids = db.query(OfficerDecision.document_id)
    documents = (
        db.query(Document)
        .filter(Document.status == "extracted")
        .filter(~Document.id.in_(decided_document_ids))
        .order_by(Document.created_at)
        .all()
    )
    finding_counts = {
        (document_id, status): count
        for document_id, status, count in db.query(
            Finding.document_id, Finding.status, func.count()
        )
        .filter(Finding.document_id.in_([document.id for document in documents]))
        .group_by(Finding.document_id, Finding.status)
    }
    return [
        QueuedDocumentOut(
            id=document.id,
            organisation_id=document.organisation_id,
            organisation_name=document.organisation.name,
            uploaded_by=document.uploaded_by,
            filename=document.filename,
            status=document.status,
            created_at=document.created_at,
            decided_count=finding_counts.get((document.id, "decided"), 0),
            abstained_count=finding_counts.get((document.id, "abstained"), 0),
        )
        for document in documents
    ]


class DecisionIn(BaseModel):
    document_id: uuid.UUID
    officer_id: str
    action: Literal["validated", "flagged"]
    note: str | None = None


class DecisionOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    officer_id: str
    action: str
    note: str | None
    decided_at: datetime

    model_config = {"from_attributes": True}


@router.post("/decisions", response_model=DecisionOut, status_code=201)
def create_decision(
    payload: DecisionIn, db: Session = Depends(get_db)
) -> OfficerDecision:
    """Record the officer's decision and move the document out of the queue."""
    document = db.get(Document, payload.document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="document not found")

    existing = (
        db.query(OfficerDecision)
        .filter_by(document_id=payload.document_id)
        .one_or_none()
    )
    if existing is not None:
        raise HTTPException(
            status_code=409, detail="document already has an officer decision"
        )

    decision = OfficerDecision(
        document_id=payload.document_id,
        officer_id=payload.officer_id,
        action=payload.action,
        note=payload.note,
    )
    db.add(decision)
    document.status = payload.action
    db.commit()
    db.refresh(decision)
    return decision
