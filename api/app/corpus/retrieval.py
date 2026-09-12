"""Retrieves the corpus chunks most relevant to a query, by embedding similarity."""

from sqlalchemy.orm import Session

from app.db.models import CorpusChunk
from app.providers.embeddings import embed

DEFAULT_TOP_K = 5


def search(db: Session, query: str, top_k: int = DEFAULT_TOP_K) -> list[CorpusChunk]:
    """The top_k corpus chunks closest to the query, nearest first."""
    (query_vector,) = embed([query])
    return (
        db.query(CorpusChunk)
        .order_by(CorpusChunk.embedding.cosine_distance(query_vector))
        .limit(top_k)
        .all()
    )
