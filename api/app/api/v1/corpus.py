"""Legal corpus endpoints: search, passage reader, sources, related texts, verification queue.

Only passages a person has verified leave these endpoints with their text
(D-029). Passage models require `verified_by` and `verified_on`, so an
unverified chunk fails validation instead of reaching a response. The
verification queue names unverified chunks by reference only: a person checks
the official page, not our extraction.
"""

import uuid
from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.corpus.related import related_passages, related_query
from app.corpus.retrieval import DEFAULT_TOP_K, Hit, excerpts, search
from app.db.models import CorpusChunk, CorpusSource, Finding, Rule
from app.db.session import get_db

router = APIRouter(prefix="/corpus", tags=["corpus"])
findings_router = APIRouter(prefix="/findings", tags=["corpus"])

VERIFIED = "verified"
MatchType = Literal["texte", "sens", "les deux"]


class SourceOut(BaseModel):
    id: str
    title: str
    edition: str
    publisher: str
    url: str
    sha256: str
    language: str
    page_count: int
    loaded_at: datetime

    model_config = {"from_attributes": True}


class SourceSummaryOut(SourceOut):
    verified_passages: int
    total_passages: int
    citing_rules: list[str]


class PassageOut(BaseModel):
    id: uuid.UUID
    source_id: str
    source_title: str
    source_edition: str
    article_ref: str
    paragraph_ref: str
    page: int
    verified_by: str
    verified_on: date
    official_url: str


class PassageTextOut(PassageOut):
    text: str


class PassageHitOut(PassageOut):
    excerpt: str
    match: MatchType


class PassageDetailOut(BaseModel):
    passage: PassageTextOut
    previous: PassageTextOut | None
    next: PassageTextOut | None
    outline: list[PassageOut]
    source: SourceOut


class QueueEntryOut(BaseModel):
    id: uuid.UUID
    source_id: str
    article_ref: str
    paragraph_ref: str
    page: int
    official_url: str


def _official_url(source: CorpusSource, page: int) -> str:
    return f"{source.url}#page={page}"


def _passage_fields(chunk: CorpusChunk, source: CorpusSource) -> dict:
    return {
        "id": chunk.id,
        "source_id": source.id,
        "source_title": source.title,
        "source_edition": source.edition,
        "article_ref": chunk.article_ref,
        "paragraph_ref": chunk.paragraph_ref,
        "page": chunk.page,
        "verified_by": chunk.verified_by,
        "verified_on": chunk.verified_on,
        "official_url": _official_url(source, chunk.page),
    }


def _passage_text(
    chunk: CorpusChunk | None, source: CorpusSource
) -> PassageTextOut | None:
    if chunk is None or chunk.verification_status != VERIFIED:
        return None
    return PassageTextOut(**_passage_fields(chunk, source), text=chunk.text)


def _match(hit: Hit) -> MatchType:
    if hit.by_meaning and hit.by_text:
        return "les deux"
    return "texte" if hit.by_text else "sens"


def _hits_out(db: Session, query: str, hits: list[Hit]) -> list[PassageHitOut]:
    marked = excerpts(db, query, [hit.chunk.id for hit in hits])
    sources = {source.id: source for source in db.query(CorpusSource)}
    return [
        PassageHitOut(
            **_passage_fields(hit.chunk, sources[hit.chunk.source_id]),
            excerpt=marked[hit.chunk.id],
            match=_match(hit),
        )
        for hit in hits
    ]


@router.get("/search", response_model=list[PassageHitOut])
def search_passages(
    q: str = Query(min_length=1, max_length=500),
    top_k: int = Query(DEFAULT_TOP_K, ge=1, le=20),
    db: Session = Depends(get_db),
) -> list[PassageHitOut]:
    """Verified passages for a query, best first: passages, never answers, and no model sees the query."""
    return _hits_out(db, q, search(db, q, top_k=top_k, verified_only=True))


@router.get("/chunks/{chunk_id}", response_model=PassageDetailOut)
def get_passage(chunk_id: uuid.UUID, db: Session = Depends(get_db)) -> PassageDetailOut:
    """A verified passage, its verified neighbours, its article's verified outline and its source.

    An unverified chunk answers 404, exactly like a missing one.
    """
    chunk = db.get(CorpusChunk, chunk_id)
    if chunk is None or chunk.verification_status != VERIFIED:
        raise HTTPException(status_code=404, detail="passage not found")
    source = db.get(CorpusSource, chunk.source_id)
    article = (
        db.query(CorpusChunk)
        .filter_by(source_id=chunk.source_id, article_ref=chunk.article_ref)
        .order_by(CorpusChunk.char_start)
        .all()
    )
    position = article.index(chunk)
    return PassageDetailOut(
        passage=_passage_text(chunk, source),
        previous=_passage_text(article[position - 1], source) if position else None,
        next=_passage_text(article[position + 1], source)
        if position + 1 < len(article)
        else None,
        outline=[
            PassageOut(**_passage_fields(c, source))
            for c in article
            if c.verification_status == VERIFIED
        ],
        source=SourceOut.model_validate(source),
    )


@router.get("/sources", response_model=list[SourceSummaryOut])
def list_sources(db: Session = Depends(get_db)) -> list[SourceSummaryOut]:
    """Every indexed source with its provenance, passage counts and the rules citing it."""
    total = dict(
        db.query(CorpusChunk.source_id, func.count())
        .group_by(CorpusChunk.source_id)
        .all()
    )
    verified = dict(
        db.query(CorpusChunk.source_id, func.count())
        .filter(CorpusChunk.verification_status == VERIFIED)
        .group_by(CorpusChunk.source_id)
        .all()
    )
    rules = db.query(Rule).order_by(Rule.code).all()
    return [
        SourceSummaryOut(
            **SourceOut.model_validate(source).model_dump(),
            verified_passages=verified.get(source.id, 0),
            total_passages=total.get(source.id, 0),
            # A rule cites a source when its citation URL is the source's official URL.
            citing_rules=[rule.code for rule in rules if rule.url == source.url],
        )
        for source in db.query(CorpusSource).order_by(CorpusSource.id)
    ]


@router.get("/verification-queue", response_model=list[QueueEntryOut])
def verification_queue(db: Session = Depends(get_db)) -> list[QueueEntryOut]:
    """Unverified chunks in document order, by reference and official page only, never text."""
    rows = (
        db.query(CorpusChunk, CorpusSource)
        .join(CorpusSource)
        .filter(CorpusChunk.verification_status != VERIFIED)
        .order_by(CorpusSource.id, CorpusChunk.char_start)
        .all()
    )
    return [
        QueueEntryOut(
            id=chunk.id,
            source_id=source.id,
            article_ref=chunk.article_ref,
            paragraph_ref=chunk.paragraph_ref,
            page=chunk.page,
            official_url=_official_url(source, chunk.page),
        )
        for chunk, source in rows
    ]


@findings_router.get("/{finding_id}/related", response_model=list[PassageHitOut])
def get_related_passages(
    finding_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[PassageHitOut]:
    """Verified passages related to a finding's rule and missing fact, its own citation left out."""
    finding = db.get(Finding, finding_id)
    if finding is None:
        raise HTTPException(status_code=404, detail="finding not found")
    rule = db.get(Rule, finding.rule_id)
    query = related_query(rule, finding)
    return _hits_out(db, query, related_passages(db, query, rule.verbatim_text))
