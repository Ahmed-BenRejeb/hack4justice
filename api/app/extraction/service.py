"""Runs extraction against an uploaded document and records the outcome."""

from collections.abc import Mapping

from sqlalchemy.orm import Session

from app.db.models import Document, DocumentPage, Extraction
from app.extraction.fields import extract_document_fields
from app.extraction.masking import mask_with_originals
from app.extraction.ocr import OcrResult, UnsupportedDocumentType, extract_text
from app.extraction.photos import UnusablePhotos
from app.extraction.positions import locate_field
from app.providers.openrouter import OpenRouterError
from app.storage import save_page_image


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
    _store_pages(db, document, result)
    document.status = "extracted"
    db.flush()

    _run_field_extraction(db, document, masked_text, originals, result)


def _store_pages(db: Session, document: Document, result: OcrResult) -> None:
    """One DocumentPage per rendered page (J3), the pixel space every field's bbox is expressed in."""
    for page in result.pages:
        image_ref = save_page_image(document.id, page.page, page.content)
        db.add(
            DocumentPage(
                document_id=document.id,
                page=page.page,
                image_ref=image_ref,
                width=page.width,
                height=page.height,
            )
        )


def _run_field_extraction(
    db: Session,
    document: Document,
    masked_text: str,
    originals: Mapping[str, str],
    result: OcrResult,
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
        location = locate_field(field.raw_value, result.words)
        db.add(
            Extraction(
                document_id=document.id,
                field_name=field_name,
                value=field.value,
                confidence=field.confidence,
                source="assisted",
                page=location.page if location else None,
                bbox=(
                    {
                        "x0": location.x0,
                        "y0": location.y0,
                        "x1": location.x1,
                        "y1": location.y1,
                    }
                    if location
                    else None
                ),
            )
        )
    if fields:
        db.flush()
