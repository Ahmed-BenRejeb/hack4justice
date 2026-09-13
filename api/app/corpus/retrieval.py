"""Retrieves the corpus chunks most relevant to a query (docs/feature-research.md section 5.3).

Two searches run: embedding similarity, which finds paraphrases, and French
full-text search, which finds exact legal terms ("honoraires", "loyers
d'hôtels") that vectors blur. Their rankings are fused by reciprocal rank,
which needs no score calibration between the two. Evaluation ranks the whole
corpus, verified or not, so it measures retrieval alone; callers that show
text rank verified passages only (D-029).
"""

import uuid
from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass

from sqlalchemy import ColumnElement, cast, func, select
from sqlalchemy.dialects.postgresql import TSQUERY, to_tsvector, ts_headline
from sqlalchemy.orm import Session

from app.config import (
    CORPUS_TEXT_SEARCH_CONFIG,
    RETRIEVAL_CANDIDATES,
    RETRIEVAL_MIN_SIMILARITY,
    RRF_K,
    TEXT_QUERY_MIN_LEXEME_CHARS,
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
    by_text: bool  # among the full-text candidates: contains a query term


def fuse(rankings: Sequence[Sequence[uuid.UUID]], k: int = RRF_K) -> list[uuid.UUID]:
    """Reciprocal rank fusion: ids ordered by the sum of 1 / (k + rank) over the rankings."""
    scores: dict[uuid.UUID, float] = defaultdict(float)
    for ranking in rankings:
        for rank, item in enumerate(ranking, 1):
            scores[item] += 1 / (k + rank)
    return sorted(scores, key=scores.__getitem__, reverse=True)


def text_query(query: str) -> ColumnElement[str]:
    """The query's stemmed, accent-folded terms, any one of which may match.

    Terms are ORed: a question rarely shares every term with the passage that
    answers it, and ts_rank_cd still ranks passages matching more terms first.
    Terms under TEXT_QUERY_MIN_LEXEME_CHARS are dropped, because the French
    stop-word list misses "les" (stemmed "le") and, once accents are folded,
    "à" ("a"): ORed, they match most passages.
    """
    # ponytail: a length cut, not a stop-word list; it also drops "IS", "RS" and
    # two-digit numbers. Upgrade to a stop-word dictionary file on the database server.
    lexeme = func.unnest(
        func.tsvector_to_array(to_tsvector(CORPUS_TEXT_SEARCH_CONFIG, query))
    ).column_valued("lexeme")
    terms = (
        select(func.string_agg(func.quote_literal(lexeme), " | "))
        .where(func.length(lexeme) >= TEXT_QUERY_MIN_LEXEME_CHARS)
        .scalar_subquery()
    )
    return cast(func.coalesce(terms, ""), TSQUERY)


def search(
    db: Session,
    query: str,
    top_k: int | None = DEFAULT_TOP_K,
    verified_only: bool = False,
) -> list[Hit]:
    """Chunks for a query, best first; top_k=None keeps every candidate.

    verified_only ranks verified chunks only, so unverified chunks never crowd
    a verified passage out of the candidates.
    """
    verified = [CorpusChunk.verification_status == "verified"] if verified_only else []
    (query_vector,) = embed([query])
    distance = CorpusChunk.embedding.cosine_distance(query_vector)
    by_meaning = db.scalars(
        select(CorpusChunk.id)
        # Nearest neighbours always exist; the floor stops an unrelated query
        # from returning passages on meaning alone.
        .where(distance <= 1 - RETRIEVAL_MIN_SIMILARITY, *verified)
        .order_by(distance)
        .limit(RETRIEVAL_CANDIDATES)
    ).all()

    terms = text_query(query)
    by_text = db.scalars(
        select(CorpusChunk.id)
        .where(CorpusChunk.text_search.bool_op("@@")(terms), *verified)
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
