"""Runs extraction against an uploaded document and records the outcome."""

from sqlalchemy.orm import Session

from app.db.models import Document, Extraction
from app.extraction.ocr import UnsupportedDocumentType, extract_text


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
