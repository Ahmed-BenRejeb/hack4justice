import hashlib

from sqlalchemy.orm import Session

from app.corpus.chunking import Page
from app.corpus.service import index_source
from app.db.models import CorpusChunk, CorpusSource
from tests.fixtures.corpus import make_source

TWO_PARAGRAPHS = (
    "ARTICLE 1 :\nI. Premiere disposition de test.\nII. Deuxieme disposition de test.\n"
)


def test_index_source_stores_paragraph_chunks_with_provenance(db: Session) -> None:
    count = index_source(db, make_source(), [Page(3, TWO_PARAGRAPHS)])
    db.commit()

    assert count == 2
    assert db.get(CorpusSource, "fixture-code") is not None
    chunks = db.query(CorpusChunk).order_by(CorpusChunk.char_start).all()
    assert [c.paragraph_ref for c in chunks] == ["I", "II"]
    assert chunks[0].heading_path == "Code fictif 2026 > Article 1 > I"
    assert chunks[0].page == 3
    assert chunks[0].text_sha256 == hashlib.sha256(chunks[0].text.encode()).hexdigest()
    assert all(c.embedding is not None for c in chunks)


def test_reindexing_updates_in_place_and_removes_chunks_no_longer_produced(
    db: Session,
) -> None:
    index_source(db, make_source(), [Page(3, TWO_PARAGRAPHS)])
    db.commit()
    first_ids = {c.paragraph_ref: c.id for c in db.query(CorpusChunk)}

    index_source(db, make_source(), [Page(3, TWO_PARAGRAPHS)])
    db.commit()
    assert {c.paragraph_ref: c.id for c in db.query(CorpusChunk)} == first_ids

    index_source(
        db, make_source(), [Page(3, "ARTICLE 1 :\nI. Premiere disposition de test.\n")]
    )
    db.commit()
    assert {c.paragraph_ref: c.id for c in db.query(CorpusChunk)} == {
        "I": first_ids["I"]
    }


def test_index_source_returns_zero_for_text_without_articles(db: Session) -> None:
    assert index_source(db, make_source("empty"), [Page(1, "no headings here")]) == 0
