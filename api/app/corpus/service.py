"""Indexes a legal source text into the corpus: chunk by article, embed, store."""

from sqlalchemy.orm import Session

from app.corpus.chunking import chunk_by_article
from app.db.models import CorpusChunk
from app.providers.embeddings import embed


def index_source(db: Session, source_id: str, url: str, text: str) -> int:
    """Chunk a source text by article and store each chunk with its embedding.

    Returns the number of chunks stored; 0 if the text has no recognizable
    article headings.
    """
    chunks = chunk_by_article(text)
    if not chunks:
        return 0

    vectors = embed([chunk.text for chunk in chunks])
    for chunk, vector in zip(chunks, vectors, strict=True):
        db.add(
            CorpusChunk(
                source_id=source_id,
                article_ref=chunk.article_ref,
                text=chunk.text,
                embedding=vector,
                url=url,
            )
        )
    db.flush()
    return len(chunks)
