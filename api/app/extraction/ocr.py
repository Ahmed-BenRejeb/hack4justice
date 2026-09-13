"""Extracts text from an uploaded document.

Born-digital PDFs (already having a text layer) are read directly. Scanned
PDFs and image uploads fall back to OCR, in French, Arabic and English:
Tunisian administrative documents mix the two official languages.
"""

import io
from dataclasses import dataclass

import pypdf
import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image

OCR_LANGUAGES = "fra+ara+eng"
MIN_TEXT_LAYER_CHARS = 20

PDF_CONTENT_TYPES = {"application/pdf"}
IMAGE_CONTENT_TYPES = {"image/png", "image/jpeg", "image/tiff"}


class UnsupportedDocumentType(ValueError):
    pass


@dataclass(frozen=True)
class OcrResult:
    text: str
    method: str  # "text_layer" or "ocr"

    @property
    def confidence(self) -> float:
        """A text layer is exact; OCR output can misread characters."""
        return 1.0 if self.method == "text_layer" else 0.7


def _read_pdf_text_layer(content: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _ocr_pdf(content: bytes) -> str:
    pages = convert_from_bytes(content)
    return "\n".join(
        pytesseract.image_to_string(page, lang=OCR_LANGUAGES) for page in pages
    )


def _ocr_image(content: bytes) -> str:
    image = Image.open(io.BytesIO(content))
    return pytesseract.image_to_string(image, lang=OCR_LANGUAGES)


def extract_text(content: bytes, content_type: str) -> OcrResult:
    """Return the best-effort text content of an uploaded document."""
    if content_type in PDF_CONTENT_TYPES:
        text_layer = _read_pdf_text_layer(content)
        if len(text_layer.strip()) >= MIN_TEXT_LAYER_CHARS:
            return OcrResult(text=text_layer, method="text_layer")
        return OcrResult(text=_ocr_pdf(content), method="ocr")
    if content_type in IMAGE_CONTENT_TYPES:
        return OcrResult(text=_ocr_image(content), method="ocr")
    raise UnsupportedDocumentType(f"unsupported content type: {content_type}")
