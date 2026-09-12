import json
from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from app.corpus.load_corpus import main as load_corpus_main
from app.db.models import CorpusChunk

SAMPLE_SOURCE = """
Code fictif de test.

Article 1
Premiere disposition de test.

Article 2
Deuxieme disposition de test.
"""


def test_load_corpus_main_indexes_every_manifest_entry(
    tmp_path: Path, db: Session, capsys: pytest.CaptureFixture[str]
) -> None:
    (tmp_path / "fixture-code.txt").write_text(SAMPLE_SOURCE)
    (tmp_path / "manifest.json").write_text(
        json.dumps(
            [
                {
                    "source_id": "fixture-code",
                    "file": "fixture-code.txt",
                    "url": "https://example.test/code",
                }
            ]
        )
    )

    load_corpus_main(tmp_path)

    chunks = db.query(CorpusChunk).filter_by(source_id="fixture-code").all()
    assert len(chunks) == 2
    output = capsys.readouterr()
    assert "2 chunks" in output.out


def test_load_corpus_main_reports_no_manifest(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    load_corpus_main(tmp_path)

    output = capsys.readouterr()
    assert "no manifest.json found" in output.out
