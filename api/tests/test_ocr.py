import pytest

from app.extraction.ocr import UnsupportedDocumentType, extract_text
from tests.conftest import make_born_digital_pdf, make_scanned_pdf, make_text_image


def test_extract_text_reads_born_digital_pdf_text_layer() -> None:
    pdf_bytes = make_born_digital_pdf("Certificat de retenue a la source: article 62.")

    result = extract_text(pdf_bytes, "application/pdf")

    assert result.method == "text_layer"
    assert result.confidence == 1.0
    assert "article 62" in result.text


def test_extract_text_positions_words_from_the_pdf_text_layer() -> None:
    pdf_bytes = make_born_digital_pdf("Certificat de retenue a la source: article 62.")

    result = extract_text(pdf_bytes, "application/pdf")

    assert len(result.pages) == 1
    page = result.pages[0]
    assert page.page == 1
    assert page.width > 0 and page.height > 0
    assert page.content.startswith(b"\x89PNG")
    assert {word.text for word in result.words} >= {"Certificat", "article", "62."}
    for word in result.words:
        assert word.page == 1
        assert 0 <= word.x0 < word.x1 <= page.width
        assert 0 <= word.y0 < word.y1 <= page.height


def test_extract_text_ocrs_an_image() -> None:
    image_bytes = make_text_image("Quittance fiscale valide")

    result = extract_text(image_bytes, "image/png")

    assert result.method == "ocr"
    assert result.confidence < 1.0
    assert "fiscale" in result.text.lower()


def test_extract_text_positions_words_from_ocr() -> None:
    image_bytes = make_text_image("Quittance fiscale valide")

    result = extract_text(image_bytes, "image/png")

    assert len(result.pages) == 1
    assert any(word.text.lower() == "fiscale" for word in result.words)
    for word in result.words:
        assert word.page == 1
        assert word.x1 > word.x0
        assert word.y1 > word.y0


def test_extract_text_falls_back_to_ocr_for_scanned_pdf() -> None:
    pdf_bytes = make_scanned_pdf("Extrait RNE conforme")

    result = extract_text(pdf_bytes, "application/pdf")

    assert result.method == "ocr"
    assert "rne" in result.text.lower() or "extrait" in result.text.lower()
    assert len(result.pages) == 1


def test_extract_text_rejects_unsupported_content_type() -> None:
    with pytest.raises(UnsupportedDocumentType):
        extract_text(b"not a real document", "text/plain")
