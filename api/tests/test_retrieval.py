import uuid

from sqlalchemy import Text, cast, select
from sqlalchemy.orm import Session

from app.corpus.chunking import Page
from app.corpus.retrieval import fuse, search, text_query
from app.corpus.service import index_source
from app.db.models import CorpusChunk
from tests.fixtures.corpus import make_source, verify

SAMPLE_SOURCE = """
Article 1
Dispositions relatives a la retenue a la source sur les paiements aux prestataires de services.

Article 2
Dispositions relatives aux conges payes et a la duree du travail des salaries.

Article 3
Dispositions relatives aux loyers d'hôtels servis aux personnes morales.
"""


def index_sample(db: Session) -> None:
    index_source(db, make_source(), [Page(1, SAMPLE_SOURCE)])
    db.commit()


def test_fuse_ranks_an_item_found_by_both_searches_first() -> None:
    a, b, c, d = (uuid.uuid4() for _ in range(4))

    assert fuse([[a, b, c], [c, d]]) == [c, a, b, d]


def test_text_query_ors_stemmed_terms_and_drops_short_ones(db: Session) -> None:
    rendered = db.scalar(
        select(cast(text_query("à propos des loyers d'hôtels et les sociétés"), Text))
    )

    assert set(rendered.split(" | ")) == {"'propos'", "'loyer'", "'hotel'", "'societ'"}


def test_search_returns_the_closest_chunk_first(db: Session) -> None:
    index_sample(db)

    hits = search(
        db, "quel taux de retenue a la source appliquer a un prestataire ?", top_k=1
    )

    assert [hit.chunk.article_ref for hit in hits] == ["Article 1"]
    assert hits[0].by_meaning


def test_search_matches_an_exact_term_whatever_its_accents(db: Session) -> None:
    index_sample(db)

    hits = search(db, "hotels", top_k=1)

    assert hits[0].chunk.article_ref == "Article 3"
    assert hits[0].by_text


def test_search_respects_top_k(db: Session) -> None:
    index_sample(db)

    assert len(search(db, "dispositions", top_k=2)) == 2


def test_an_unrelated_query_returns_no_chunk(db: Session) -> None:
    index_sample(db)

    assert search(db, "zzzz qwerty") == []


def test_unverified_chunks_do_not_crowd_out_a_verified_passage(db: Session) -> None:
    """25 unverified items rank above the verified paragraph on the same term;
    ranked among verified chunks only, the paragraph is still found."""
    items = "".join(f"- honoraires et honoraires, item {n} ;\n" for n in range(25))
    source = f"ARTICLE 1 :\nI. Paragraphe verifie sur les honoraires.\n{items}"
    index_source(db, make_source(), [Page(1, source)])
    verify(db, db.query(CorpusChunk).filter_by(paragraph_ref="I").all())
    db.commit()

    hits = search(db, "honoraires", verified_only=True)

    assert [hit.chunk.paragraph_ref for hit in hits] == ["I"]
    assert hits[0].by_text
