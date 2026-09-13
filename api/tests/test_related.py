import json
from pathlib import Path

import pypdf

from app.config import CORPUS_CHUNK_MAX_TOKENS, settings
from app.corpus.chunking import chunk_pages
from app.corpus.load_corpus import read_pages
from app.corpus.related import repeats_citation
from app.corpus.retrieval import MATCH_END, MATCH_START
from app.providers.embeddings import count_tokens

REAL_SOURCE_PDF = Path(settings.corpus_sources_dir) / "code-irpp-is-2026.pdf"
REAL_RULE = Path(settings.rules_dir) / "cirppis-art52-i-a.json"


def real_chunks() -> list:
    pages = read_pages(pypdf.PdfReader(REAL_SOURCE_PDF), 84, 98)
    return chunk_pages(pages, count_tokens, CORPUS_CHUNK_MAX_TOKENS)


def test_only_the_cited_passages_of_the_real_corpus_repeat_the_real_citation() -> None:
    citation = json.loads(REAL_RULE.read_text(encoding="utf-8"))["verbatim_text"]

    repeating = [
        (chunk.article_ref, chunk.paragraph_ref)
        for chunk in real_chunks()
        if repeats_citation(chunk.text, citation)
    ]

    assert repeating == [("Article 52", "I"), ("Article 52", "I, a)")]


def test_a_short_shared_opening_does_not_make_a_passage_the_citation() -> None:
    citation = "Ce taux est réduit à : 5% pour les loyers."

    assert not repeats_citation(
        "Ce taux est réduit à : 3% pour les honoraires.", citation
    )


def test_the_real_corpus_never_contains_the_excerpt_markers() -> None:
    assert not any(
        MATCH_START in chunk.text or MATCH_END in chunk.text for chunk in real_chunks()
    )
