"""CLI entry point: index every corpus source listed in manifest.json.

Usage: uv run python -m app.corpus.load_corpus [directory]
Defaults to the repository's root `corpus/sources/` directory. Each manifest
entry names an official PDF, the page range to index, and its provenance.
Re-running replaces a source's chunks; it never duplicates them.
"""

import hashlib
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

import pypdf

from app.config import settings
from app.corpus.chunking import Page
from app.corpus.service import index_source
from app.db.models import CorpusSource
from app.db.session import SessionLocal

DEFAULT_SOURCES_DIR = Path(settings.corpus_sources_dir)


def read_pages(reader: pypdf.PdfReader, first: int, last: int) -> list[Page]:
    """Text of PDF pages first to last (1-based, inclusive), one Page per PDF page."""
    return [
        Page(number=number, text=reader.pages[number - 1].extract_text() or "")
        for number in range(first, last + 1)
    ]


def main(sources_dir: Path = DEFAULT_SOURCES_DIR) -> int:
    """Index each manifest entry; returns the process exit code."""
    manifest_path = sources_dir / "manifest.json"
    if not manifest_path.is_file():
        print(f"no manifest.json found in {sources_dir}")
        return 0

    entries = json.loads(manifest_path.read_text(encoding="utf-8"))
    total_chunks = 0
    with SessionLocal() as db:
        for entry in entries:
            pdf_path = sources_dir / entry["file"]
            reader = pypdf.PdfReader(pdf_path)
            first, last = entry["pages"]
            source = CorpusSource(
                id=entry["source_id"],
                title=entry["title"],
                edition=entry["edition"],
                publisher=entry["publisher"],
                url=entry["url"],
                language=entry["language"],
                sha256=hashlib.sha256(pdf_path.read_bytes()).hexdigest(),
                page_count=len(reader.pages),
                loaded_at=datetime.now(UTC),
            )
            chunk_count = index_source(db, source, read_pages(reader, first, last))
            total_chunks += chunk_count
            print(f"indexed: {entry['source_id']} ({chunk_count} chunks)")
        db.commit()

    print(f"{len(entries)} source(s), {total_chunks} chunk(s) indexed")
    return 0


if __name__ == "__main__":
    directory = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCES_DIR
    raise SystemExit(main(directory))
