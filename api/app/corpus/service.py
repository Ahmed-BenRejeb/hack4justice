"""Indexes a legal source into the corpus: chunk by paragraph, embed, upsert with provenance."""

import hashlib
import uuid

from sqlalchemy import delete, func
from sqlalchemy.dialects.postgresql import insert, to_tsvector
from sqlalchemy.orm import Session

from app.config import CORPUS_CHUNK_MAX_TOKENS, CORPUS_TEXT_SEARCH_CONFIG
from app.corpus.chunking import REF_SEPARATOR, Chunk, Page, chunk_pages
from app.db.models import CorpusChunk, CorpusSource
from app.providers.embeddings import count_tokens, embed

HEADING_SEPARATOR = " > "
POSITION_KEY = ("source_id", "article_ref", "paragraph_ref", "char_start")


def heading_path(source: CorpusSource, chunk: Chunk) -> str:
    """Where a chunk sits, e.g. "Code de l'IRPP et de l'IS 2026 > Article 52 > I > a)".

    Prepended to the text for embedding only, so a short item such as
    "b) 15% au titre :" keeps its meaning.
    """
    parts = [
        f"{source.title} {source.edition}",
        chunk.article_ref,
        *chunk.paragraph_ref.split(REF_SEPARATOR),
    ]
    return HEADING_SEPARATOR.join(part for part in parts if part)


def index_source(db: Session, source: CorpusSource, pages: list[Page]) -> int:
    """Upsert a source and its chunks; chunks the source no longer produces are removed.

    Chunks are keyed by source, article, paragraph and offset, so re-indexing
    the same source keeps chunk ids stable. Returns the number of chunks.
    """
    source = db.merge(source)
    db.flush()
    chunks = chunk_pages(pages, count_tokens, CORPUS_CHUNK_MAX_TOKENS)

    kept_ids: list[uuid.UUID] = []
    if chunks:
        paths = [heading_path(source, chunk) for chunk in chunks]
        vectors = embed(
            [f"{path}\n{chunk.text}" for path, chunk in zip(paths, chunks, strict=True)]
        )
        rows = [
            {
                "id": uuid.uuid4(),
                "source_id": source.id,
                "article_ref": chunk.article_ref,
                "paragraph_ref": chunk.paragraph_ref,
                "heading_path": path,
                "page": chunk.page,
                "char_start": chunk.char_start,
                "char_end": chunk.char_end,
                "token_count": chunk.token_count,
                "text": chunk.text,
                "text_sha256": hashlib.sha256(chunk.text.encode()).hexdigest(),
                "text_search": to_tsvector(
                    CORPUS_TEXT_SEARCH_CONFIG, func.unaccent(chunk.text)
                ),
                "embedding": vector,
                "url": source.url,
            }
            for chunk, path, vector in zip(chunks, paths, vectors, strict=True)
        ]
        statement = insert(CorpusChunk).values(rows)
        statement = statement.on_conflict_do_update(
            constraint="uq_corpus_chunk_position",
            set_={
                name: statement.excluded[name]
                for name in rows[0]
                if name != "id" and name not in POSITION_KEY
            },
        ).returning(CorpusChunk.id)
        kept_ids = list(db.scalars(statement))

    db.execute(
        delete(CorpusChunk).where(
            CorpusChunk.source_id == source.id, CorpusChunk.id.not_in(kept_ids)
        )
    )
    db.flush()
    return len(chunks)
