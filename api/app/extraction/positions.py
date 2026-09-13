"""Locates a structured field's value among a document's word boxes (J3).

Pure display evidence, read by nothing a rule depends on: a field a rule
reads comes from the `Extraction.value` a model supplied (`app/extraction/
fields.py`), never from this module. When no confident, exact location is
found, the field is shown with no outline rather than an approximate one:
the same "never guess" law that governs a compliance finding applies here
to what looks like evidence on screen.
"""

import re
from dataclasses import dataclass

from app.extraction.ocr import WordBox

_NOT_ALNUM = re.compile(r"[^0-9A-Za-z]+")


def _normalise(value: str) -> str:
    """Upper-cased, punctuation and whitespace stripped, so "1 000,500" and
    "1000.500" (or an OCR line-wrapped name) compare on their characters alone.
    """
    return _NOT_ALNUM.sub("", value).upper()


@dataclass(frozen=True)
class BoundingBox:
    page: int
    x0: float
    y0: float
    x1: float
    y1: float


def locate_field(raw_value: str, words: tuple[WordBox, ...]) -> BoundingBox | None:
    """The smallest run of consecutive same-page words whose normalised text
    contains `raw_value` normalised the same way, or None if no page's words
    contain it at all.

    Words are read in the order OCR or the PDF text layer produced them,
    which is reading order within a page. A short, common value (a bare
    single digit, say) can match a run that is not the real one; there is no
    signal here to disambiguate that from the true occurrence, so the first
    match stands, same as any other best-effort UI evidence.
    """
    target = _normalise(raw_value)
    if not target:
        return None

    pages: dict[int, tuple[WordBox, ...]] = {}
    for word in words:
        pages.setdefault(word.page, ())
        pages[word.page] = (*pages[word.page], word)

    for page in sorted(pages):
        page_words = pages[page]
        match = _locate_in_page(target, page_words)
        if match is not None:
            start, end = match
            run = page_words[start : end + 1]
            return BoundingBox(
                page=page,
                x0=min(word.x0 for word in run),
                y0=min(word.y0 for word in run),
                x1=max(word.x1 for word in run),
                y1=max(word.y1 for word in run),
            )
    return None


def _locate_in_page(
    target: str, page_words: tuple[WordBox, ...]
) -> tuple[int, int] | None:
    """The (start, end) word indices of the shortest consecutive run whose
    concatenated normalised text contains `target`, or None.
    """
    normalised = [_normalise(word.text) for word in page_words]
    # Prefix sums of each word's normalised length locate, for any character
    # offset into the concatenation, which word it falls in.
    offsets = [0]
    for piece in normalised:
        offsets.append(offsets[-1] + len(piece))
    concatenated = "".join(normalised)

    start_char = concatenated.find(target)
    if start_char == -1:
        return None
    end_char = start_char + len(target)

    start_word = next(
        index
        for index in range(len(page_words))
        if offsets[index] <= start_char < offsets[index + 1]
    )
    end_word = next(
        index
        for index in range(len(page_words) - 1, -1, -1)
        if offsets[index] < end_char <= offsets[index + 1]
    )
    return start_word, end_word
