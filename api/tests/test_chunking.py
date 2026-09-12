from app.corpus.chunking import chunk_by_article

SAMPLE_SOURCE = """
Code fictif de test, table des matieres omise.

Article 1
Premiere disposition de test, sur plusieurs lignes
de texte.

Article 2bis
Deuxieme disposition de test.

Article 3
Troisieme disposition de test.
"""


def test_chunk_by_article_splits_on_headings() -> None:
    chunks = chunk_by_article(SAMPLE_SOURCE)

    assert [c.article_ref for c in chunks] == ["Article 1", "Article 2bis", "Article 3"]
    assert "Premiere disposition" in chunks[0].text
    assert "Deuxieme disposition" in chunks[1].text
    assert "Troisieme disposition" in chunks[2].text


def test_chunk_by_article_drops_front_matter() -> None:
    chunks = chunk_by_article(SAMPLE_SOURCE)
    assert not any("table des matieres" in c.text for c in chunks)


def test_chunk_by_article_returns_empty_for_text_without_headings() -> None:
    assert chunk_by_article("Just some prose, no article headings here.") == []


def test_chunk_by_article_drops_empty_trailing_section() -> None:
    chunks = chunk_by_article("Article 1\ntext\n\nArticle 2\n   \n")
    assert [c.article_ref for c in chunks] == ["Article 1"]
