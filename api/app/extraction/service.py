"""Runs extraction against an uploaded document and records the outcome."""

from sqlalchemy.orm import Session

from app.db.models import Document, Extraction
from app.extraction.fields import extract_document_fields
from app.extraction.ocr import UnsupportedDocumentType, extract_text
from app.providers.openrouter import OpenRouterError


def run_extraction(
    db: Session, document: Document, content: bytes, content_type: str
) -> None:
    """Extract the document's text and record it, or mark extraction as failed."""
    try:
        result = extract_text(content, content_type)
    except UnsupportedDocumentType:
        document.status = "extraction_failed"
        return

    db.add(
        Extraction(
            document_id=document.id,
            field_name="full_text",
            value=result.text,
            confidence=result.confidence,
            source="extracted",
        )
    )
    document.status = "extracted"
    db.flush()

    _run_field_extraction(db, document, result.text)


def _run_field_extraction(db: Session, document: Document, full_text: str) -> None:
    """Add one Extraction row per structured fiscal field the model could read.

    A provider failure (network, malformed reply) must not fail the upload:
    full_text has already landed, and any rule needing a field it could not
    read abstains naming that field, which is the designed behaviour, not
    an error path.
    """
    try:
        fields = extract_document_fields(full_text)
    except OpenRouterError:
        return

    for field_name, field in fields.items():
        db.add(
            Extraction(
                document_id=document.id,
                field_name=field_name,
                value=field.value,
                confidence=field.confidence,
                source="assisted",
            )
        )
    if fields:
        db.flush()
