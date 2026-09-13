"""Runs extraction against an uploaded document and records the outcome."""

from sqlalchemy.orm import Session

from app.db.models import Document, Extraction
from app.extraction.masking import mask
from app.extraction.ocr import UnsupportedDocumentType, extract_text


def run_extraction(
    db: Session, document: Document, content: bytes, content_type: str
) -> None:
    """Extract the document's text and its masked copy, or mark extraction as failed.

    Only `masked_text` is ever sent to a model (A1, D-013). It is stored so the
    screen can show exactly what leaves the workstation (J5).
    """
    try:
        result = extract_text(content, content_type)
    except UnsupportedDocumentType:
        document.status = "extraction_failed"
        return

    for field_name, value in (
        ("full_text", result.text),
        ("masked_text", mask(result.text, known_names=[document.organisation.name])),
    ):
        db.add(
            Extraction(
                document_id=document.id,
                field_name=field_name,
                value=value,
                confidence=result.confidence,
                source="extracted",
            )
        )
    document.status = "extracted"
    db.flush()
