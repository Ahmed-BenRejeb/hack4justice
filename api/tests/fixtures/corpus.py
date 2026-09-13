"""Corpus test helpers: a fictitious source to index synthetic pages under."""

import hashlib
from datetime import date

from sqlalchemy.orm import Session

from app.corpus.verification import VerifiedPassage, apply_register
from app.db.models import CorpusChunk, CorpusSource

TEST_CHECKER = "Relecteur de test"


def verify(db: Session, chunks: list[CorpusChunk]) -> None:
    """Apply a register verifying exactly these chunks, as a person would."""
    apply_register(
        db,
        [
            VerifiedPassage(
                source_sha256=db.get(CorpusSource, chunk.source_id).sha256,
                article_ref=chunk.article_ref,
                paragraph_ref=chunk.paragraph_ref,
                page=chunk.page,
                text_sha256=hashlib.sha256(chunk.text.encode()).hexdigest(),
                checked_by=TEST_CHECKER,
                checked_on=date(2026, 9, 13),
            )
            for chunk in chunks
        ],
    )


def make_source(source_id: str = "fixture-code") -> CorpusSource:
    """A fictitious source row; its fields are test values, not real provenance."""
    return CorpusSource(
        id=source_id,
        title="Code fictif",
        edition="2026",
        publisher="Editeur de test",
        url="https://example.test/code.pdf",
        sha256="0" * 64,
        language="fr",
        page_count=1,
    )
