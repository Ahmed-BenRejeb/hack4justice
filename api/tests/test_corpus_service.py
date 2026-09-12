from sqlalchemy.orm import Session

from app.corpus.service import index_source
from app.db.models import CorpusChunk

SAMPLE_SOURCE = """
Code fictif de test.

Article 1
Premiere disposition de test.

Article 2
Deuxieme disposition de test.
"""


def test_index_source_stores_one_chunk_per_article_with_embedding(db: Session) -> None:
    count = index_source(
        db,
        source_id="fixture-code",
        url="https://example.test/code",
        text=SAMPLE_SOURCE,
    )
    db.commit()

    assert count == 2
    chunks = db.query(CorpusChunk).order_by(CorpusChunk.article_ref).all()
    assert [c.article_ref for c in chunks] == ["Article 1", "Article 2"]
    assert all(c.embedding is not None for c in chunks)
    assert all(c.source_id == "fixture-code" for c in chunks)


def test_index_source_returns_zero_for_text_without_articles(db: Session) -> None:
    count = index_source(
        db, source_id="empty", url="https://example.test/empty", text="no headings here"
    )
    assert count == 0
