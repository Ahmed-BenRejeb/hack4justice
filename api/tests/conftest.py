"""Shared test fixtures. Requires the docker-compose Postgres instance running."""

import io
from pathlib import Path

import pytest
from fpdf import FPDF
from PIL import Image, ImageDraw, ImageFont
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import engine

# The font path is distribution-specific: Arch first, then Debian/Ubuntu.
LIBERATION_SANS_PATHS = (
    "/usr/share/fonts/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
)
LIBERATION_SANS = next(
    (path for path in LIBERATION_SANS_PATHS if Path(path).exists()),
    LIBERATION_SANS_PATHS[0],
)


@pytest.fixture(autouse=True)
def _clean_schema() -> None:
    """Recreate every table fresh for each test."""
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS unaccent"))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)


@pytest.fixture
def db() -> Session:
    session = Session(bind=engine)
    try:
        yield session
    finally:
        session.close()


def make_born_digital_pdf(text_content: str) -> bytes:
    """A PDF with a real, extractable text layer."""
    pdf = FPDF()
    pdf.add_page()
    pdf.add_font("Liberation", "", LIBERATION_SANS)
    pdf.set_font("Liberation", size=14)
    pdf.cell(text=text_content)
    return bytes(pdf.output())


def make_text_image(text_content: str) -> bytes:
    """A PNG with the given text rendered onto it, for OCR."""
    image = Image.new("RGB", (900, 100), color="white")
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(LIBERATION_SANS, 32)
    draw.text((10, 10), text_content, fill="black", font=font)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def make_scanned_pdf(text_content: str) -> bytes:
    """A PDF made only of a page image, with no text layer, for OCR fallback."""
    image = Image.new("RGB", (900, 100), color="white")
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(LIBERATION_SANS, 32)
    draw.text((10, 10), text_content, fill="black", font=font)
    buffer = io.BytesIO()
    image.save(buffer, format="PDF")
    return buffer.getvalue()
