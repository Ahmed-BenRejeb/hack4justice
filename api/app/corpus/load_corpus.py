"""CLI entry point: index every corpus source listed in manifest.json.

Usage: uv run python -m app.corpus.load_corpus [directory]
Defaults to the repository's root `corpus/sources/` directory.
"""

import json
import sys
from pathlib import Path

from app.config import settings
from app.corpus.service import index_source
from app.db.session import SessionLocal

DEFAULT_SOURCES_DIR = Path(settings.corpus_sources_dir)


def main(sources_dir: Path = DEFAULT_SOURCES_DIR) -> int:
    manifest_path = sources_dir / "manifest.json"
    if not manifest_path.is_file():
        print(f"no manifest.json found in {sources_dir}")
        return 0

    entries = json.loads(manifest_path.read_text(encoding="utf-8"))
    total_chunks = 0
    with SessionLocal() as db:
        for entry in entries:
            source_path = sources_dir / entry["file"]
            text = source_path.read_text(encoding="utf-8")
            chunk_count = index_source(db, entry["source_id"], entry["url"], text)
            total_chunks += chunk_count
            print(f"indexed: {entry['source_id']} ({chunk_count} chunks)")
        db.commit()

    print(f"{len(entries)} source(s), {total_chunks} chunk(s) indexed")
    return 0


if __name__ == "__main__":
    directory = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCES_DIR
    raise SystemExit(main(directory))
