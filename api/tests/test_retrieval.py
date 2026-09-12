from sqlalchemy.orm import Session

from app.corpus.retrieval import search
from app.corpus.service import index_source

SAMPLE_SOURCE = """
Article 1
Dispositions relatives a la retenue a la source sur les paiements aux prestataires de services.

Article 2
Dispositions relatives aux conges payes et a la duree du travail des salaries.

Article 3
Dispositions relatives a l'immatriculation des vehicules automobiles.
"""


def test_search_returns_the_closest_chunk_first(db: Session) -> None:
    index_source(
        db,
        source_id="fixture-code",
        url="https://example.test/code",
        text=SAMPLE_SOURCE,
    )
    db.commit()

    results = search(
        db, "quel taux de retenue a la source appliquer a un prestataire ?", top_k=1
    )

    assert len(results) == 1
    assert results[0].article_ref == "Article 1"


def test_search_respects_top_k(db: Session) -> None:
    index_source(
        db,
        source_id="fixture-code",
        url="https://example.test/code",
        text=SAMPLE_SOURCE,
    )
    db.commit()

    results = search(db, "droit du travail", top_k=2)

    assert len(results) == 2
