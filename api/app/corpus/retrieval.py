"""Retrieves the corpus chunks most relevant to a query (docs/feature-research.md section 5.3).

Two searches run over the whole corpus, verified or not, so evaluation measures
retrieval alone: embedding similarity, which finds paraphrases, and French
full-text search, which finds exact legal terms ("honoraires", "loyers
d'hôtels") that vectors blur. Their rankings are fused by reciprocal rank,
which needs no score calibration between the two. Keeping only verified
passages is the API's job, before anything leaves it (D-029).
"""

import uuid
from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass

from sqlalchemy import ColumnElement, Text, cast, func, select
from sqlalchemy.dialects.postgresql import TSQUERY, plainto_tsquery
from sqlalchemy.orm import Session

from app.config import (
    CORPUS_TEXT_SEARCH_CONFIG,
    RETRIEVAL_CANDIDATES,
    RETRIEVAL_MIN_SIMILARITY,
    RRF_K,
)
from app.db.models import CorpusChunk
from app.providers.embeddings import embed

DEFAULT_TOP_K = 5


@dataclass(frozen=True)
class Hit:
    chunk: CorpusChunk
    by_meaning: bool  # among the embedding search candidates
    by_text: bool  # contains a query term, after stemming and accent folding


def fuse(rankings: Sequence[Sequence[uuid.UUID]], k: int = RRF_K) -> list[uuid.UUID]:
    """Reciprocal rank fusion: ids ordered by the sum of 1 / (k + rank) over the rankings."""
    scores: dict[uuid.UUID, float] = defaultdict(float)
    for ranking in rankings:
        for rank, item in enumerate(ranking, 1):
            scores[item] += 1 / (k + rank)
    return sorted(scores, key=scores.__getitem__, reverse=True)


def text_query(query: str) -> ColumnElement[str]:
    """The query's stemmed, accent-folded terms, any one of which may match.

    plainto_tsquery requires every term. A question rarely shares every term
    with the passage that answers it, so its AND operators become OR, and
    ts_rank_cd still ranks passages matching more terms first.
    """
    terms = plainto_tsquery(CORPUS_TEXT_SEARCH_CONFIG, func.unaccent(query))
    return cast(func.replace(cast(terms, Text), "&", "|"), TSQUERY)


def search(db: Session, query: str, top_k: int = DEFAULT_TOP_K) -> list[Hit]:
    """The top_k chunks for a query, best first."""
    (query_vector,) = embed([query])
    distance = CorpusChunk.embedding.cosine_distance(query_vector)
    by_meaning = db.scalars(
        select(CorpusChunk.id)
        # Nearest neighbours always exist; the floor stops an unrelated query
        # from returning passages on meaning alone.
        .where(distance <= 1 - RETRIEVAL_MIN_SIMILARITY)
        .order_by(distance)
        .limit(RETRIEVAL_CANDIDATES)
    ).all()

    terms = text_query(query)
    by_text = db.scalars(
        select(CorpusChunk.id)
        .where(CorpusChunk.text_search.bool_op("@@")(terms))
        .order_by(
            func.ts_rank_cd(CorpusChunk.text_search, terms).desc(), CorpusChunk.id
        )
        .limit(RETRIEVAL_CANDIDATES)
    ).all()

    top = fuse([by_meaning, by_text])[:top_k]
    chunks = {
        chunk.id: chunk
        for chunk in db.query(CorpusChunk).filter(CorpusChunk.id.in_(top))
    }
    meaning, text = set(by_meaning), set(by_text)
    return [Hit(chunks[i], by_meaning=i in meaning, by_text=i in text) for i in top]
