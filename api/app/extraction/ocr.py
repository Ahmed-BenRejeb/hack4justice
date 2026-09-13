"""Extracts text from an uploaded document, alongside a page image and each
word's position on it, so a structured field can be shown outlined on the
page it was read from (J3).

Born-digital PDFs (already having a text layer) are read directly, and their
words are positioned with pdfplumber (the PDF's own layout, no OCR). Scanned
PDFs and image uploads fall back to OCR, in French, Arabic and English:
Tunisian administrative documents mix the two official languages; their
words are positioned by Tesseract's own word boxes, in the same rasterised
image the page preview uses.
"""

import io
from dataclasses import dataclass

import pdfplumber
import pypdf
import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image
from pytesseract import Output

from app.extraction.photos import prepare_page

OCR_LANGUAGES = "fra+ara+eng"
MIN_TEXT_LAYER_CHARS = 20

PDF_CONTENT_TYPES = {"application/pdf"}
IMAGE_CONTENT_TYPES = {"image/png", "image/jpeg", "image/tiff"}

# Page preview resolution. Pixel positions recorded for a word (either from
# pdfplumber's point space or Tesseract's own raster) are always scaled to
# this same DPI, so a bounding box means the same thing regardless of path.
RASTER_DPI = 150
_POINTS_PER_INCH = 72.0
_PDF_TO_RASTER_SCALE = RASTER_DPI / _POINTS_PER_INCH

# Below this Tesseract word-confidence (0 to 100, -1 for a non-text region),
# a box is noise, not a word: recording it would outline nothing readable.
MIN_WORD_CONFIDENCE = 40


class UnsupportedDocumentType(ValueError):
    pass


@dataclass(frozen=True)
class WordBox:
    """One word and where it sits on its (1-indexed) page, in raster pixels."""

    page: int
    text: str
    x0: float
    y0: float
    x1: float
    y1: float


@dataclass(frozen=True)
class PageImage:
    """A page rendered once at RASTER_DPI, so the browser and the word boxes agree on pixels."""

    page: int
    content: bytes
    width: int
    height: int


@dataclass(frozen=True)
class OcrResult:
    text: str
    method: str  # "text_layer" or "ocr"
    pages: tuple[PageImage, ...]
    words: tuple[WordBox, ...]

    @property
    def confidence(self) -> float:
        """A text layer is exact; OCR output can misread characters."""
        return 1.0 if self.method == "text_layer" else 0.7


def _render_pages(content: bytes, content_type: str) -> list[Image.Image]:
    if content_type in PDF_CONTENT_TYPES:
        return convert_from_bytes(content, dpi=RASTER_DPI)
    # An image upload is usually a phone photo: turned upright and reduced first (G3).
    return [prepare_page(content)]


def _page_images(rendered: list[Image.Image]) -> tuple[PageImage, ...]:
    pages = []
    for index, image in enumerate(rendered, start=1):
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        pages.append(
            PageImage(
                page=index, content=buffer.getvalue(), width=image.width, height=image.height
            )
        )
    return tuple(pages)


def _read_pdf_text_layer(content: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _pdf_text_layer_words(content: bytes) -> tuple[WordBox, ...]:
    """Word boxes from the PDF's own text layer, scaled from PDF points to RASTER_DPI pixels.

    pdfplumber's origin is already top-left with y increasing downward, the
    same convention as an image and as Tesseract's own boxes, so only the
    unit (points to pixels) needs converting.
    """
    words: list[WordBox] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            for word in page.extract_words():
                words.append(
                    WordBox(
                        page=page_number,
                        text=word["text"],
                        x0=word["x0"] * _PDF_TO_RASTER_SCALE,
                        y0=word["top"] * _PDF_TO_RASTER_SCALE,
                        x1=word["x1"] * _PDF_TO_RASTER_SCALE,
                        y1=word["bottom"] * _PDF_TO_RASTER_SCALE,
                    )
                )
    return tuple(words)


def _ocr_words(rendered: list[Image.Image]) -> tuple[WordBox, ...]:
    """Word boxes from Tesseract, already in the rasterised image's own pixel space."""
    words: list[WordBox] = []
    for page_number, image in enumerate(rendered, start=1):
        data = pytesseract.image_to_data(
            image, lang=OCR_LANGUAGES, output_type=Output.DICT
        )
        for index, text in enumerate(data["text"]):
            if not text.strip() or int(data["conf"][index]) < MIN_WORD_CONFIDENCE:
                continue
            left, top = data["left"][index], data["top"][index]
            words.append(
                WordBox(
                    page=page_number,
                    text=text,
                    x0=float(left),
                    y0=float(top),
                    x1=float(left + data["width"][index]),
                    y1=float(top + data["height"][index]),
                )
            )
    return tuple(words)


def _ocr_text(rendered: list[Image.Image]) -> str:
    return "\n".join(
        pytesseract.image_to_string(image, lang=OCR_LANGUAGES) for image in rendered
    )


def extract_text(content: bytes, content_type: str) -> OcrResult:
    """Return the best-effort text content of an uploaded document, its page
    images, and its words' positions on those pages.
    """
    if content_type in PDF_CONTENT_TYPES:
        text_layer = _read_pdf_text_layer(content)
        rendered = _render_pages(content, content_type)
        if len(text_layer.strip()) >= MIN_TEXT_LAYER_CHARS:
            return OcrResult(
                text=text_layer,
                method="text_layer",
                pages=_page_images(rendered),
                words=_pdf_text_layer_words(content),
            )
        return OcrResult(
            text=_ocr_text(rendered),
            method="ocr",
            pages=_page_images(rendered),
            words=_ocr_words(rendered),
        )
    if content_type in IMAGE_CONTENT_TYPES:
        rendered = _render_pages(content, content_type)
        return OcrResult(
            text=_ocr_text(rendered),
            method="ocr",
            pages=_page_images(rendered),
            words=_ocr_words(rendered),
        )
    raise UnsupportedDocumentType(f"unsupported content type: {content_type}")
