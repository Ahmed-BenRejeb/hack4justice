"""Splits a legal source into citable pieces: article > paragraph > item, with page provenance.

Structure is read from line-start markers only ("ARTICLE 52 :", "I.", "a)",
"1-", "-"), so chunking stays content-agnostic: it never interprets what a
paragraph says. A citation is a paragraph ("Article 52, I, a)"), so the piece
retrieval returns is the unit a person cites and verifies.
"""

import re
from bisect import bisect_right
from collections.abc import Callable
from dataclasses import dataclass

# Heading styles seen in real editions of the same code: "Article 52.-" (the
# 2024 printer's copy) and "ARTICLE 52 :" (the DGI's 2026 edition).
ARTICLE_HEADING = re.compile(r"(?mi)^\s*Article\s+(\d+\w*)\s*[.:]?\s*-?\s*$")
ROMAN_MARKER = re.compile(r"^\s*([IVX]+(?:\s+(?:bis|ter|quater))?)\s*\.\s+")
ITEM_MARKER = re.compile(r"^\s*([a-z](?:\s+(?:bis|ter|quater))?\)|\d+\s*-)\s+")
DASH_MARKER = re.compile(r"^\s*-\s+")
# The DGI PDF prints its page number as the first line of every page.
PAGE_NUMBER_LINE = re.compile(r"^\s*\d+\s*\n")
SENTENCE_BREAK = re.compile(r"(?<=[.;])\s+")
BLANK_LINE = re.compile(r"\n\s*\n")

REF_SEPARATOR = ", "


@dataclass(frozen=True)
class Page:
    number: int  # 1-based page number in the source PDF
    text: str


@dataclass(frozen=True)
class Chunk:
    article_ref: str
    paragraph_ref: str  # "I, a), tiret 2"; "" for an article's lead text
    page: int
    char_start: int  # offsets into the joined page text, stable per source
    char_end: int
    text: str
    token_count: int


def normalize_text(raw: str) -> str:
    """Collapse layout whitespace, keeping blank-line paragraph breaks.

    Words, stray spaces inside words and footnotes are left as extracted: this
    removes PDF line wrapping, it does not rewrite the text.
    """
    blocks = (" ".join(block.split()) for block in BLANK_LINE.split(raw))
    return "\n\n".join(block for block in blocks if block)


def _join_pages(pages: list[Page]) -> tuple[str, list[int], list[int]]:
    """Joined text without printed page numbers, plus each page's start offset."""
    parts, starts, numbers, offset = [], [], [], 0
    for page in pages:
        text = PAGE_NUMBER_LINE.sub("", page.text, count=1)
        starts.append(offset)
        numbers.append(page.number)
        parts.append(text)
        offset += len(text) + 1
    return "\n".join(parts), starts, numbers


def _structural_pieces(text: str, start: int, end: int) -> list[tuple[str, int, int]]:
    """(paragraph_ref, char_start, char_end) for each marker-delimited piece of an article body."""
    roman, item, dash = "", "", 0
    pieces: list[tuple[str, int, int]] = []
    piece_ref, piece_start = "", start

    for line in re.finditer(r"[^\n]*\n?", text[start:end]):
        line_text = line.group()
        roman_match = ROMAN_MARKER.match(line_text)
        rest = line_text[roman_match.end() :] if roman_match else line_text
        item_match = ITEM_MARKER.match(rest)
        dash_match = None if roman_match or item_match else DASH_MARKER.match(line_text)
        if not (roman_match or item_match or dash_match):
            continue

        if roman_match:
            roman, item, dash = roman_match.group(1), "", 0
        if item_match:
            item, dash = item_match.group(1).replace(" -", "-"), 0
        if dash_match:
            dash += 1

        line_start = start + line.start()
        pieces.append((piece_ref, piece_start, line_start))
        parts = [roman, item, f"tiret {dash}" if dash else ""]
        piece_ref, piece_start = REF_SEPARATOR.join(p for p in parts if p), line_start

    pieces.append((piece_ref, piece_start, end))
    return pieces


def _sentence_windows(
    text: str, start: int, end: int, count_tokens: Callable[[str], int], max_tokens: int
) -> list[tuple[int, int]]:
    """Split an oversized piece by sentence, each window overlapping the last by one sentence."""
    bounds = [start + m.end() for m in SENTENCE_BREAK.finditer(text[start:end])]
    sentences = list(zip([start, *bounds], [*bounds, end], strict=True))
    windows: list[tuple[int, int]] = []
    first = 0
    while first < len(sentences):
        last = first
        # ponytail: a single sentence over max_tokens stays whole and is truncated at embedding.
        while (
            last + 1 < len(sentences)
            and count_tokens(text[sentences[first][0] : sentences[last + 1][1]])
            <= max_tokens
        ):
            last += 1
        windows.append((sentences[first][0], sentences[last][1]))
        if last + 1 >= len(sentences):
            break
        first = last if last > first else last + 1
    return windows


def chunk_pages(
    pages: list[Page], count_tokens: Callable[[str], int], max_tokens: int
) -> list[Chunk]:
    """Split source pages into paragraph- and item-level chunks under max_tokens.

    Text before the first article heading (front matter, section titles) is
    dropped. A source with no recognizable heading yields no chunks.
    """
    text, page_starts, page_numbers = _join_pages(pages)
    headings = list(ARTICLE_HEADING.finditer(text))
    chunks = []
    for index, heading in enumerate(headings):
        article_ref = f"Article {heading.group(1)}"
        body_end = (
            headings[index + 1].start() if index + 1 < len(headings) else len(text)
        )
        for paragraph_ref, start, end in _structural_pieces(
            text, heading.end(), body_end
        ):
            if not normalize_text(text[start:end]):
                continue
            windows = (
                _sentence_windows(text, start, end, count_tokens, max_tokens)
                if count_tokens(normalize_text(text[start:end])) > max_tokens
                else [(start, end)]
            )
            for window_start, window_end in windows:
                chunk_text = normalize_text(text[window_start:window_end])
                chunks.append(
                    Chunk(
                        article_ref=article_ref,
                        paragraph_ref=paragraph_ref,
                        page=page_numbers[bisect_right(page_starts, window_start) - 1],
                        char_start=window_start,
                        char_end=window_end,
                        text=chunk_text,
                        token_count=count_tokens(chunk_text),
                    )
                )
    return chunks
