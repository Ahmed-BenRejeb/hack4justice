"""Document upload and lookup endpoints. Upload runs OCR/text extraction inline."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import Document, Extraction, Organisation
from app.db.session import get_db
from app.extraction.service import run_extraction
from app.storage import save_upload

router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentOut(BaseModel):
    id: uuid.UUID
    organisation_id: uuid.UUID
    uploaded_by: str
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
    extractions: list[ExtractionOut]


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
    storage_ref = save_upload(file.filename or "document", content)

    document = Document(
        organisation_id=organisation_id,
        uploaded_by=uploaded_by,
        storage_ref=storage_ref,
        status="uploaded",
    )
    db.add(document)
    db.flush()

    run_extraction(db, document, content, file.content_type or "")

    db.commit()
    db.refresh(document)
    return document


@router.get("/{document_id}", response_model=DocumentDetailOut)
def get_document(
    document_id: uuid.UUID, db: Session = Depends(get_db)
) -> DocumentDetailOut:
    """A document with its extraction results."""
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="document not found")
    extractions = (
        db.query(Extraction)
        .filter_by(document_id=document_id)
        .order_by(Extraction.extracted_at)
        .all()
    )
    return DocumentDetailOut(
        **DocumentOut.model_validate(document).model_dump(),
        extractions=[ExtractionOut.model_validate(e) for e in extractions],
    )
