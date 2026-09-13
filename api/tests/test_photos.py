import io

import pypdf
import pytest
from PIL import Image

from app.extraction.ocr import extract_text
from app.extraction.photos import MAX_PAGES, UnusablePhotos, combine_photos
from tests.conftest import make_text_image

EXIF_ORIENTATION_TAG = 0x0112
# Orientation 6: the stored pixels must turn 90 degrees clockwise to display upright.
ROTATE_CLOCKWISE_TO_VIEW = 6


def _sideways_photo(text: str) -> bytes:
    """A JPEG stored lying on its side, with the EXIF tag a phone writes to say so."""
    upright = Image.open(io.BytesIO(make_text_image(text)))
    exif = Image.Exif()
    exif[EXIF_ORIENTATION_TAG] = ROTATE_CLOCKWISE_TO_VIEW
    buffer = io.BytesIO()
    upright.rotate(90, expand=True).save(buffer, format="JPEG", exif=exif)
    return buffer.getvalue()


def test_combine_photos_makes_one_pdf_page_per_photo_in_order() -> None:
    pdf_bytes = combine_photos(
        [make_text_image("Facture honoraires"), make_text_image("Quittance fiscale")]
    )

    assert len(pypdf.PdfReader(io.BytesIO(pdf_bytes)).pages) == 2
    text = extract_text(pdf_bytes, "application/pdf").text.lower()
    assert text.index("facture") < text.index("quittance")


def test_a_sideways_phone_photo_is_read_upright() -> None:
    result = extract_text(_sideways_photo("Quittance fiscale valide"), "image/jpeg")

    assert "fiscale" in result.text.lower()


def test_combine_photos_refuses_unreadable_or_too_many_photos() -> None:
    with pytest.raises(UnusablePhotos):
        combine_photos([make_text_image("Page"), b"not an image"])
    with pytest.raises(UnusablePhotos):
        combine_photos([make_text_image("Page")] * (MAX_PAGES + 1))
