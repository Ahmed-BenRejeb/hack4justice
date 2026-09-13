"""Turns phone photos of a paper document into pages the OCR can read (G3, D-055).

A phone photographs a multi-page document one page at a time. The pages are
stored as one PDF, so a filing stays one document and the existing scanned-PDF
path reads it. Each page is turned upright first: phones record orientation as
an EXIF tag rather than rotating the pixels, and Tesseract ignores that tag.
"""

import io

from PIL import Image, ImageOps

# A 12 MP phone photo OCRs no better than this, and several times slower.
# Calibration knob: raise it if small print starts misreading.
MAX_PAGE_PIXELS = 3000
# Written as the PDF's resolution so pdf2image, which renders at 200 DPI by
# default, gets each page back at its own size instead of enlarging it.
PAGE_DPI = 200.0
# A payment file is a few pages; the cap bounds the memory one request can use.
MAX_PAGES = 20


class UnusablePhotos(ValueError):
    """The photos cannot form a document: too many, or one is not a readable image."""


def prepare_page(content: bytes) -> Image.Image:
    """Open one photographed page upright, in RGB, at most MAX_PAGE_PIXELS on its long side."""
    try:
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(content))).convert("RGB")
    except (OSError, Image.DecompressionBombError) as error:
        raise UnusablePhotos("a photo is not a readable image") from error
    image.thumbnail((MAX_PAGE_PIXELS, MAX_PAGE_PIXELS))
    return image


def combine_photos(photos: list[bytes]) -> bytes:
    """Return one PDF with a page per photo, in the order given."""
    if not photos or len(photos) > MAX_PAGES:
        raise UnusablePhotos(f"a document takes 1 to {MAX_PAGES} photos")
    pages = [prepare_page(content) for content in photos]
    buffer = io.BytesIO()
    pages[0].save(
        buffer,
        format="PDF",
        save_all=True,
        append_images=pages[1:],
        resolution=PAGE_DPI,
    )
    return buffer.getvalue()
