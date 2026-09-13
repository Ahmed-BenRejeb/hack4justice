"""Applies the tracked verified-passage register to indexed chunks (D-029).

A chunk is verified only while a person's register entry matches its source
file hash, article, paragraph and text hash. A changed source PDF or a changed
chunk text returns it to unverified until a person checks it again.

CLI, to prepare a register entry after checking a passage against the PDF:
    uv run python -m app.corpus.verification "Article 52" "I, a)"
"""

import hashlib
import json
import sys
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.db.models import CorpusChunk, CorpusSource
from app.db.session import SessionLocal


@dataclass(frozen=True)
class VerifiedPassage:
    source_sha256: str
    article_ref: str
    paragraph_ref: str
    page: int
    text_sha256: str
    checked_by: str
    checked_on: date


def load_register(path: Path) -> list[VerifiedPassage]:
    """Read the register; an entry without a named checker or an ISO check date is rejected."""
    passages = []
    for entry in json.loads(path.read_text(encoding="utf-8")):
        if not str(entry.get("checked_by", "")).strip():
            raise ValueError(
                "register entry has no checker: "
                f"{entry.get('article_ref')} {entry.get('paragraph_ref')}"
            )
        checked_on = date.fromisoformat(entry["checked_on"])
        passages.append(VerifiedPassage(**{**entry, "checked_on": checked_on}))
    return passages


def apply_register(
    db: Session, register: list[VerifiedPassage]
) -> list[VerifiedPassage]:
    """Mark every chunk a register entry matches verified, and every other chunk unverified.

    Returns the entries that matched no chunk, so a stale verification is
    reported instead of silently dropped.
    """
    db.execute(
        update(CorpusChunk)
        .values(verification_status="unverified", verified_by=None, verified_on=None)
        .execution_options(synchronize_session=False)
    )
    unmatched = []
    for passage in register:
        result = db.execute(
            update(CorpusChunk)
            .where(
                CorpusChunk.source_id == CorpusSource.id,
                CorpusSource.sha256 == passage.source_sha256,
                CorpusChunk.article_ref == passage.article_ref,
                CorpusChunk.paragraph_ref == passage.paragraph_ref,
                CorpusChunk.text_sha256 == passage.text_sha256,
            )
            .values(
                verification_status="verified",
                verified_by=passage.checked_by,
                verified_on=passage.checked_on,
            )
            .execution_options(synchronize_session=False)
        )
        if result.rowcount == 0:
            unmatched.append(passage)
    db.flush()
    return unmatched


def main(article_ref: str, paragraph_ref: str) -> int:
    """Print each chunk at a reference, its official page, and a register entry for a person to complete."""
    with SessionLocal() as db:
        rows = (
            db.query(CorpusChunk, CorpusSource)
            .join(CorpusSource)
            .filter(
                CorpusChunk.article_ref == article_ref,
                CorpusChunk.paragraph_ref == paragraph_ref,
            )
            .order_by(CorpusChunk.char_start)
            .all()
        )
    if not rows:
        print(f"no indexed chunk at {article_ref} {paragraph_ref}")
        return 1
    for chunk, source in rows:
        print(f"--- compare with {source.url}#page={chunk.page}")
        print(chunk.text)
        entry = VerifiedPassage(
            source_sha256=source.sha256,
            article_ref=chunk.article_ref,
            paragraph_ref=chunk.paragraph_ref,
            page=chunk.page,
            text_sha256=hashlib.sha256(chunk.text.encode()).hexdigest(),
            checked_by="",
            checked_on=date.min,
        )
        # The checker and date stay blank: only the person who read the page fills them.
        print(
            json.dumps(
                {**asdict(entry), "checked_on": ""}, ensure_ascii=False, indent=2
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1], sys.argv[2]))
