"""The sole module producing retrieval embeddings (root CLAUDE.md provider boundary).

Default: a local, multilingual sentence-transformers model, so no corpus or
document text has to leave the machine to be indexed (D-012). A hosted
alternative (OpenRouter's embeddings endpoint, verified reachable) could
replace this module without any caller changing, since it is the one place
that produces vectors.
"""

from functools import lru_cache

from sentence_transformers import SentenceTransformer

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"


@lru_cache(maxsize=1)
def _model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


def count_tokens(text: str) -> int:
    """How many tokens the embedding model reads for this text, special tokens excluded."""
    return len(_model().tokenizer(text, add_special_tokens=False)["input_ids"])


def embed(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts. Vector length matches app.config's embedding_dimensions."""
    vectors = _model().encode(texts, normalize_embeddings=True)
    return vectors.tolist()
