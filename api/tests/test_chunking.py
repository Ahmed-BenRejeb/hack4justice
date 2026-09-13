from pathlib import Path

import pypdf

from app.config import CORPUS_CHUNK_MAX_TOKENS, settings
from app.corpus.chunking import Page, chunk_pages
from app.corpus.load_corpus import read_pages
from app.providers.embeddings import count_tokens

REAL_SOURCE_PDF = Path(settings.corpus_sources_dir) / "code-irpp-is-2026.pdf"


def word_count(text: str) -> int:
    return len(text.split())


def refs(chunks: list) -> list[tuple[str, str]]:
    return [(chunk.article_ref, chunk.paragraph_ref) for chunk in chunks]


def test_splits_articles_into_paragraphs_items_and_dashes() -> None:
    text = (
        "12 \nSection de tete\nARTICLE 7 :\nI. Premier paragraphe :\n"
        "a) premier item :\n- premier tiret ;\n- second tiret.\nb bis) autre item\n"
        "II. 1- item numerote\n2 - second item\nARTICLE 8 :\nTexte sans paragraphe.\n"
    )

    chunks = chunk_pages([Page(10, text)], word_count, 100)

    assert refs(chunks) == [
        ("Article 7", "I"),
        ("Article 7", "I, a)"),
        ("Article 7", "I, a), tiret 1"),
        ("Article 7", "I, a), tiret 2"),
        ("Article 7", "I, b bis)"),
        ("Article 7", "II, 1-"),
        ("Article 7", "II, 2-"),
        ("Article 8", ""),
    ]
    assert chunks[0].text == "I. Premier paragraphe :"
    assert not any("Section de tete" in chunk.text for chunk in chunks)


def test_accepts_every_heading_style_seen_in_real_editions() -> None:
    """ "Article 52.-" (2024 copy), "ARTICLE 52 :" (DGI 2026); a cross-reference
    that happens to end a line is not a heading."""
    text = (
        "Article 52.-  \nI. Premiere disposition, voir l'article 55. (Ajoute)\n"
        "ARTICLE 53 : \nI. Deuxieme disposition.\nArticle 54\nTroisieme.\n"
    )

    chunks = chunk_pages([Page(1, text)], word_count, 100)

    assert refs(chunks) == [
        ("Article 52", "I"),
        ("Article 53", "I"),
        ("Article 54", ""),
    ]


def test_records_the_page_a_chunk_starts_on_and_drops_printed_page_numbers() -> None:
    pages = [
        Page(84, "108 \nARTICLE 52 :\nI. Debut du paragraphe\n"),
        Page(85, "109 \nsuite du paragraphe.\nII. Second paragraphe.\n"),
    ]

    chunks = chunk_pages(pages, word_count, 100)

    assert [(chunk.paragraph_ref, chunk.page) for chunk in chunks] == [
        ("I", 84),
        ("II", 85),
    ]
    assert "suite du paragraphe" in chunks[0].text
    assert "109" not in chunks[0].text


def test_splits_an_oversized_piece_by_sentence_with_one_sentence_overlap() -> None:
    text = "ARTICLE 1 :\nI. Un deux trois. Quatre cinq six. Sept huit neuf. Dix onze douze.\n"

    chunks = chunk_pages([Page(1, text)], word_count, 7)

    assert [chunk.text for chunk in chunks] == [
        "I. Un deux trois. Quatre cinq six.",
        "Quatre cinq six. Sept huit neuf.",
        "Sept huit neuf. Dix onze douze.",
    ]
    assert {chunk.paragraph_ref for chunk in chunks} == {"I"}
    assert len({chunk.char_start for chunk in chunks}) == 3


def test_returns_no_chunks_for_text_without_headings() -> None:
    assert (
        chunk_pages(
            [Page(1, "Just some prose, no article headings here.")], word_count, 100
        )
        == []
    )


def test_real_articles_52_to_55_chunk_by_paragraph_under_the_size_guard() -> None:
    pages = read_pages(pypdf.PdfReader(REAL_SOURCE_PDF), 84, 98)

    chunks = chunk_pages(pages, count_tokens, CORPUS_CHUNK_MAX_TOKENS)

    assert {chunk.article_ref for chunk in chunks} == {
        "Article 52",
        "Article 53",
        "Article 54",
        "Article 55",
    }
    assert all(chunk.token_count <= CORPUS_CHUNK_MAX_TOKENS for chunk in chunks)
    by_ref: dict = {}
    for chunk in chunks:  # first window of a paragraph split by the size guard
        by_ref.setdefault((chunk.article_ref, chunk.paragraph_ref), chunk)
    honoraires = by_ref[("Article 52", "I, a)")]
    assert honoraires.page == 84
    assert honoraires.text.startswith("a) 10%(1) au titre des honoraires")
    assert by_ref[("Article 52", "II, 1-")].page == 89
    assert by_ref[("Article 55", "I")].page == 97
