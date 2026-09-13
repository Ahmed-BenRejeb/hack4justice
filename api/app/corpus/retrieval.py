"""Retrieves the corpus chunks most relevant to a query (docs/feature-research.md section 5.3).

Two searches run over the whole corpus, verified or not, so evaluation measures
retrieval alone: embedding similarity, which finds paraphrases, and French
full-text search, which finds exact legal terms ("honoraires", "loyers
d'hôtels") that vectors blur. Their rankings are fused by reciprocal rank,
which needs no score calibration between the two. Callers that show text ask
for verified passages only (D-029).
"""

import uuid
from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass

from sqlalchemy import ColumnElement, Text, cast, func, select
from sqlalchemy.dialects.postgresql import TSQUERY, plainto_tsquery, ts_headline
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
# Excerpt highlight markers: control characters absent from the corpus (checked
# by tests), so the web splits on them and never renders an HTML string.
MATCH_START = "\x02"
MATCH_END = "\x03"
HEADLINE_OPTIONS = (
    f"StartSel={MATCH_START}, StopSel={MATCH_END}, MinWords=12, MaxWords=30"
)


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
    terms = plainto_tsquery(CORPUS_TEXT_SEARCH_CONFIG, query)
    return cast(func.replace(cast(terms, Text), "&", "|"), TSQUERY)


def search(
    db: Session,
    query: str,
    top_k: int | None = DEFAULT_TOP_K,
    verified_only: bool = False,
) -> list[Hit]:
    """Chunks for a query, best first; top_k=None keeps every candidate.

    verified_only filters before the cut, so unverified chunks ranked above
    verified ones do not empty a request for verified passages.
    """
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

    ranked = fuse([by_meaning, by_text])
    chunks = {
        chunk.id: chunk
        for chunk in db.query(CorpusChunk).filter(CorpusChunk.id.in_(ranked))
    }
    if verified_only:
        ranked = [i for i in ranked if chunks[i].verification_status == "verified"]
    meaning, text = set(by_meaning), set(by_text)
    return [
        Hit(chunks[i], by_meaning=i in meaning, by_text=i in text)
        for i in ranked[:top_k]
    ]


def excerpts(
    db: Session, query: str, chunk_ids: Sequence[uuid.UUID]
) -> dict[uuid.UUID, str]:
    """A short excerpt of each chunk around the query's terms, matches between MATCH_START and MATCH_END."""
    rows = db.execute(
        select(
            CorpusChunk.id,
            ts_headline(
                CORPUS_TEXT_SEARCH_CONFIG,
                CorpusChunk.text,
                text_query(query),
                HEADLINE_OPTIONS,
            ),
        ).where(CorpusChunk.id.in_(chunk_ids))
    ).all()
    return {chunk_id: excerpt for chunk_id, excerpt in rows}
