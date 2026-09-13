"""Splits a legal source text into article-level chunks, ready for embedding.

Chunking is generic and content-agnostic: it looks for "Article N" headings
and slices the text between them. It does not know or assert anything about
what any specific article says.
"""

import re
from dataclasses import dataclass

# Heading styles seen in real editions of the same code: "Article 52.-" (the
# 2024 printer's copy) and "ARTICLE 52 :" (the DGI's 2026 edition).
ARTICLE_HEADING = re.compile(r"(?mi)^\s*Article\s+(\d+\w*)\s*[.:]?\s*-?\s*$")


@dataclass(frozen=True)
class Chunk:
    article_ref: str
    text: str


def chunk_by_article(source_text: str) -> list[Chunk]:
    """One chunk per "Article N" heading found in the text.

    Text before the first heading (front matter, table of contents) is
    dropped. A source with no recognizable heading yields no chunks.
    """
    headings = list(ARTICLE_HEADING.finditer(source_text))
    chunks = []
    for index, heading in enumerate(headings):
        start = heading.end()
        end = (
            headings[index + 1].start()
            if index + 1 < len(headings)
            else len(source_text)
        )
        body = source_text[start:end].strip()
        if body:
            chunks.append(Chunk(article_ref=f"Article {heading.group(1)}", text=body))
    return chunks
