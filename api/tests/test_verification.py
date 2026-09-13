import hashlib
import json
from datetime import date
from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from app.config import settings
from app.corpus.chunking import Page
from app.corpus.load_corpus import main as load_corpus_main
from app.corpus.service import index_source
from app.corpus.verification import (
    VerifiedPassage,
    apply_register,
    load_register,
)
from app.corpus.verification import main as show_reference
from app.db.models import CorpusChunk
from tests.fixtures.corpus import make_source

TWO_PARAGRAPHS = (
    "ARTICLE 1 :\nI. Premiere disposition de test.\nII. Deuxieme disposition de test.\n"
)
FIRST_PARAGRAPH = "I. Premiere disposition de test."


def passage_for(text: str, **overrides: object) -> VerifiedPassage:
    fields = {
        "source_sha256": make_source().sha256,
        "article_ref": "Article 1",
        "paragraph_ref": "I",
        "page": 3,
        "text_sha256": hashlib.sha256(text.encode()).hexdigest(),
        "checked_by": "Relecteur de test",
        "checked_on": date(2026, 9, 13),
    }
    return VerifiedPassage(**{**fields, **overrides})


def status_by_ref(db: Session) -> dict[str, tuple[str, str | None]]:
    db.expire_all()
    return {
        chunk.paragraph_ref: (chunk.verification_status, chunk.verified_by)
        for chunk in db.query(CorpusChunk)
    }


def test_a_matching_register_entry_verifies_only_its_chunk(db: Session) -> None:
    index_source(db, make_source(), [Page(3, TWO_PARAGRAPHS)])

    unmatched = apply_register(db, [passage_for(FIRST_PARAGRAPH)])
    db.commit()

    assert unmatched == []
    assert status_by_ref(db) == {
        "I": ("verified", "Relecteur de test"),
        "II": ("unverified", None),
    }


@pytest.mark.parametrize(
    "override",
    [
        {"source_sha256": "f" * 64},  # the official PDF changed
        {"text_sha256": "f" * 64},  # the chunk text changed
        {"paragraph_ref": "II"},
    ],
)
def test_an_entry_that_no_longer_matches_returns_the_chunk_to_unverified(
    db: Session, override: dict[str, str]
) -> None:
    index_source(db, make_source(), [Page(3, TWO_PARAGRAPHS)])
    apply_register(db, [passage_for(FIRST_PARAGRAPH)])

    unmatched = apply_register(db, [passage_for(FIRST_PARAGRAPH, **override)])
    db.commit()

    assert len(unmatched) == 1
    assert status_by_ref(db)["I"] == ("unverified", None)


def test_load_register_rejects_an_entry_without_a_checker(tmp_path: Path) -> None:
    entry = {
        "source_sha256": "0" * 64,
        "article_ref": "Article 1",
        "paragraph_ref": "I",
        "page": 3,
        "text_sha256": "0" * 64,
        "checked_by": " ",
        "checked_on": "2026-09-13",
    }
    register_path = tmp_path / "verified-passages.json"
    register_path.write_text(json.dumps([entry]))

    with pytest.raises(ValueError, match="no checker"):
        load_register(register_path)


def test_every_entry_of_the_real_register_matches_the_real_corpus(
    db: Session, capsys: pytest.CaptureFixture[str]
) -> None:
    load_corpus_main(Path(settings.corpus_sources_dir))

    register = load_register(Path(settings.verified_passages_path))
    verified = db.query(CorpusChunk).filter_by(verification_status="verified").all()
    assert len(verified) == len(register)
    assert "matches no chunk" not in capsys.readouterr().out


def test_show_reference_prints_the_text_and_an_entry_to_complete(
    db: Session, capsys: pytest.CaptureFixture[str]
) -> None:
    index_source(db, make_source(), [Page(3, TWO_PARAGRAPHS)])
    db.commit()

    assert show_reference("Article 1", "II") == 0

    output = capsys.readouterr().out
    assert "II. Deuxieme disposition de test." in output
    assert hashlib.sha256(b"II. Deuxieme disposition de test.").hexdigest() in output
    assert '"checked_by": ""' in output
