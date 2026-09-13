"""Document upload and lookup endpoints. Upload runs OCR/text extraction inline."""

import uuid
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.export import ExportOut
from app.api.v1.officer import DecisionOut
from app.api.v1.organisations import OrganisationOut
from app.db.models import (
    Citation,
    Document,
    DocumentPage,
    Export,
    Extraction,
    Finding,
    OfficerDecision,
    Organisation,
    Rule,
)
from app.db.session import get_db
from app.extraction.service import run_extraction
from app.rules.service import evaluate_all_rules
from app.storage import read_file, save_upload

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


class BBoxOut(BaseModel):
    """A field's outline on its page (J3), in that page's own pixel space (see PageOut)."""

    x0: float
    y0: float
    x1: float
    y1: float


class ExtractionOut(BaseModel):
    id: uuid.UUID
    field_name: str
    value: str
    confidence: float
    source: str
    # Where this field was found on the document; null for full_text/masked_text
    # and for a field app/extraction/positions.py could not locate exactly.
    page: int | None = None
    bbox: BBoxOut | None = None

    model_config = {"from_attributes": True}


class PageOut(BaseModel):
    """One rendered page, and the pixel size every Extraction.bbox on it is expressed in."""

    page: int
    width: int
    height: int
    image_url: str


class DocumentDetailOut(DocumentOut):
    """A document with everything the pipeline has produced for it so far."""

    organisation: OrganisationOut
    extractions: list[ExtractionOut]
    officer_decision: DecisionOut | None
    export: ExportOut | None


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile,
    organisation_id: uuid.UUID,
    uploaded_by: str,
    db: Session = Depends(get_db),
) -> Document:
    """Store an uploaded file, record it, and run OCR/text extraction on it."""
    organisation = db.get(Organisation, organisation_id)
    if organisation is None:
        raise HTTPException(status_code=404, detail="organisation not found")

    content = await file.read()
    # Keep the base name only: some clients send a path, and the name is shown to people.
    filename = Path(file.filename or "document").name
    storage_ref = save_upload(filename, content)

    document = Document(
        organisation_id=organisation_id,
        uploaded_by=uploaded_by,
        filename=filename,
        storage_ref=storage_ref,
        status="uploaded",
    )
    db.add(document)
    db.flush()

    run_extraction(db, document, content, file.content_type or "")
    if document.status == "extracted":
        evaluate_all_rules(db, document.id)

    db.commit()
    db.refresh(document)
    return document


@router.get("/{document_id}", response_model=DocumentDetailOut)
def get_document(
    document_id: uuid.UUID, db: Session = Depends(get_db)
) -> DocumentDetailOut:
    """A document with its organisation, extraction results, officer decision and export."""
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="document not found")
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
    document_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[FindingOut]:
    """Findings for a document, each with its rule's code and citation resolved."""
    if db.get(Document, document_id) is None:
        raise HTTPException(status_code=404, detail="document not found")

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


@router.get("/{document_id}/pages", response_model=list[PageOut])
def get_document_pages(
    document_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[PageOut]:
    """The document's rendered pages, in order, for the source viewer (J3)."""
    if db.get(Document, document_id) is None:
        raise HTTPException(status_code=404, detail="document not found")

    pages = (
        db.query(DocumentPage)
        .filter_by(document_id=document_id)
        .order_by(DocumentPage.page)
        .all()
    )
    return [
        PageOut(
            page=page.page,
            width=page.width,
            height=page.height,
            image_url=f"/api/v1/documents/{document_id}/pages/{page.page}/image",
        )
        for page in pages
    ]


@router.get("/{document_id}/pages/{page}/image")
def get_document_page_image(
    document_id: uuid.UUID, page: int, db: Session = Depends(get_db)
) -> Response:
    """The page's rendered PNG, at the pixel size its PageOut and every
    Extraction.bbox on it agree on."""
    document_page = (
        db.query(DocumentPage).filter_by(document_id=document_id, page=page).one_or_none()
    )
    if document_page is None:
        raise HTTPException(status_code=404, detail="page not found")
    return Response(content=read_file(document_page.image_ref), media_type="image/png")
