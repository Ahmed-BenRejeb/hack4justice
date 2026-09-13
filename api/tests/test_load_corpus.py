from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from app.config import settings
from app.corpus.load_corpus import main as load_corpus_main
from app.db.models import CorpusChunk, CorpusSource

REAL_SOURCES_DIR = Path(settings.corpus_sources_dir)
# From corpus/sources/SOURCE.md, the DGI 2026 edition as downloaded.
REAL_SOURCE_SHA256 = "49f6e72cb4d6066a3f3723c2d9de091bd552fe94008f72dec182b1b61ceb4b7f"


def test_load_corpus_indexes_the_real_source_with_provenance(
    db: Session, capsys: pytest.CaptureFixture[str]
) -> None:
    load_corpus_main(REAL_SOURCES_DIR)

    source = db.get(CorpusSource, "cirppis-retenues-a-la-source")
    assert source.sha256 == REAL_SOURCE_SHA256
    assert source.page_count == 125
    honoraires = (
        db.query(CorpusChunk)
        .filter_by(article_ref="Article 52", paragraph_ref="I, a)")
        .one()
    )
    assert honoraires.page == 84
    assert (
        honoraires.heading_path
        == "Code de l'IRPP et de l'IS 2026 > Article 52 > I > a)"
    )
    assert "chunk(s) indexed" in capsys.readouterr().out


def test_load_corpus_twice_replaces_instead_of_duplicating(db: Session) -> None:
    load_corpus_main(REAL_SOURCES_DIR)
    first_ids = {chunk.id for chunk in db.query(CorpusChunk)}

    load_corpus_main(REAL_SOURCES_DIR)
    db.expire_all()

    assert {chunk.id for chunk in db.query(CorpusChunk)} == first_ids


def test_load_corpus_main_reports_no_manifest(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    load_corpus_main(tmp_path)

    assert "no manifest.json found" in capsys.readouterr().out
