"""Runs extraction against an uploaded document and records the outcome."""

from collections.abc import Mapping

from sqlalchemy.orm import Session

from app.db.models import Document, Extraction
from app.extraction.fields import extract_document_fields
from app.extraction.masking import mask_with_originals
from app.extraction.ocr import UnsupportedDocumentType, extract_text
from app.extraction.photos import UnusablePhotos
from app.providers.openrouter import OpenRouterError


def run_extraction(
    db: Session, document: Document, content: bytes, content_type: str
) -> None:
    """Extract the document's text, its masked copy, and the fiscal fields read from that copy.

    Only `masked_text` is ever sent to a model (A1, D-013). It is stored so the
    screen can show exactly what leaves the workstation (J5).
    """
    try:
        result = extract_text(content, content_type)
    except (UnsupportedDocumentType, UnusablePhotos):
        document.status = "extraction_failed"
        return

    masked_text, originals = mask_with_originals(
        result.text, known_names=[document.organisation.name]
    )
    for field_name, value in (("full_text", result.text), ("masked_text", masked_text)):
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

    _run_field_extraction(db, document, masked_text, originals)


def _run_field_extraction(
    db: Session, document: Document, masked_text: str, originals: Mapping[str, str]
) -> None:
    """Add one Extraction row per structured fiscal field the model could read.

    A provider failure (network, malformed reply, a refused unmasked
    identifier) must not fail the upload: full_text has already landed, and
    any rule needing a field it could not read abstains naming that field,
    which is the designed behaviour, not an error path.
    """
    try:
        fields = extract_document_fields(masked_text, originals)
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
