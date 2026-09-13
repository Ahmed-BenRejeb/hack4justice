"""Corpus test helpers: a fictitious source to index synthetic pages under."""

from app.db.models import CorpusSource


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
