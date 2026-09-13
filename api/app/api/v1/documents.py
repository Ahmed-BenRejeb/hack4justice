"""Document upload and lookup endpoints. Upload runs OCR/text extraction inline."""

import uuid
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.auth import OrganisationOut
from app.api.v1.export import ExportOut
from app.api.v1.officer import DecisionOut
from app.auth.deps import member_of, readable_document, require_filer
from app.db.models import (
    Citation,
    Document,
    Export,
    Extraction,
    Finding,
    OfficerDecision,
    Rule,
    User,
)
from app.db.session import get_db
from app.extraction.photos import UnusablePhotos, combine_photos
from app.extraction.service import run_extraction
from app.rules.service import evaluate_all_rules
from app.storage import save_upload

router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentOut(BaseModel):
    id: uuid.UUID
    organisation_id: uuid.UUID
    uploaded_by: str
    filename: str
    storage_ref: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ExtractionOut(BaseModel):
    id: uuid.UUID
    field_name: str
    value: str
    confidence: float
    source: str

    model_config = {"from_attributes": True}


class DocumentDetailOut(DocumentOut):
    """A document with everything the pipeline has produced for it so far."""

    organisation: OrganisationOut
    extractions: list[ExtractionOut]
    officer_decision: DecisionOut | None
    export: ExportOut | None


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: list[UploadFile],
    organisation_id: uuid.UUID,
    user: User = Depends(require_filer),
    db: Session = Depends(get_db),
) -> Document:
    """Store a file the signed-in user files for one of their organisations, and run extraction on it.

    Several `file` parts are the photographed pages of one paper document (G3):
    they are stored and read as one PDF, named after the first photo.
    """
    if not member_of(user, organisation_id):
        raise HTTPException(status_code=404, detail="organisation not found")

    # Keep the base name only: some clients send a path, and the name is shown to people.
    filename = Path(file[0].filename or "document").name
    if len(file) == 1:
        content = await file[0].read()
        content_type = file[0].content_type or ""
    else:
        try:
            content = combine_photos([await part.read() for part in file])
        except UnusablePhotos as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
        filename = f"{Path(filename).stem}.pdf"
        content_type = "application/pdf"
    storage_ref = save_upload(filename, content)

    document = Document(
        organisation_id=organisation_id,
        uploaded_by=user.email,
        filename=filename,
        storage_ref=storage_ref,
        status="uploaded",
    )
    db.add(document)
    db.flush()

    run_extraction(db, document, content, content_type)
    if document.status == "extracted":
        evaluate_all_rules(db, document.id)

    db.commit()
    db.refresh(document)
    return document


@router.get("/{document_id}", response_model=DocumentDetailOut)
def get_document(
    document_id: uuid.UUID,
    document: Document = Depends(readable_document),
    db: Session = Depends(get_db),
) -> DocumentDetailOut:
    """A document with its organisation, extraction results, officer decision and export."""
    extractions = (
        db.query(Extraction)
        .filter_by(document_id=document_id)
        .order_by(Extraction.extracted_at)
        .all()
    )
    decision = (
        db.query(OfficerDecision).filter_by(document_id=document_id).one_or_none()
    )
    # Nothing prevents a second export; the most recent one is the one that counts.
    export = (
        db.query(Export)
        .filter_by(document_id=document_id)
        .order_by(Export.validated_at.desc())
        .first()
    )
    return DocumentDetailOut(
        **DocumentOut.model_validate(document).model_dump(),
        organisation=OrganisationOut.model_validate(document.organisation),
        extractions=[ExtractionOut.model_validate(e) for e in extractions],
        officer_decision=DecisionOut.model_validate(decision) if decision else None,
        export=ExportOut.model_validate(export) if export else None,
    )


class CitationOut(BaseModel):
    citation_source: str
    article_ref: str
    verbatim_text: str
    url: str

    model_config = {"from_attributes": True}


class TraceStepOut(BaseModel):
    """One fact a rule used: read in the document, supplied by the model with a
    confidence, or confirmed by a person (J4)."""

    fact: str
    source: Literal["document", "model", "person"]
    value: str | bool | None
    confidence: float | None
    threshold: float | None
    confirmed_by: str | None = None
    # ISO date; set with confirmed_by when a person supplied the fact.
    confirmed_at: str | None = None


class FindingOut(BaseModel):
    id: uuid.UUID
    rule_code: str
    status: str
    decided_code: str | None
    missing_fact: str | None
    trace: list[TraceStepOut]
    created_at: datetime
    citation: CitationOut

    model_config = {"from_attributes": True}


@router.get("/{document_id}/findings", response_model=list[FindingOut])
def get_document_findings(
    document_id: uuid.UUID,
    _: Document = Depends(readable_document),
    db: Session = Depends(get_db),
) -> list[FindingOut]:
    """Findings for a document, each with its rule's code and citation resolved."""
    rows = (
        db.query(Finding, Rule)
        .join(Citation, Citation.finding_id == Finding.id)
        .join(Rule, Rule.id == Citation.rule_id)
        .filter(Finding.document_id == document_id)
        .order_by(Finding.created_at)
        .all()
    )
    return [
        FindingOut(
            id=finding.id,
            rule_code=rule.code,
            status=finding.status,
            decided_code=finding.decided_code,
            missing_fact=finding.missing_fact,
            trace=finding.trace,
            created_at=finding.created_at,
            citation=CitationOut.model_validate(rule),
        )
        for finding, rule in rows
    ]
