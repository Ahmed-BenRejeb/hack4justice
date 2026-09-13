"""The only module in api/ that reads os.environ, per the root CLAUDE.md configuration rule."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()

DOCUMENT_STORAGE_DIR_DEFAULT = "./data/documents"
EMBEDDING_DIMENSIONS_DEFAULT = 384
SCHEMAS_DIR_DEFAULT = "../schemas"
RULES_DIR_DEFAULT = "../rules"
CORPUS_SOURCES_DIR_DEFAULT = "../corpus/sources"
VERIFIED_PASSAGES_PATH_DEFAULT = "../corpus/verified-passages.json"
# Size guard for corpus chunks, in embedding-model tokens: a paragraph above it
# is split by sentence, leaving room for its heading path under a 512-token
# model limit (docs/feature-research.md section 5.3).
CORPUS_CHUNK_MAX_TOKENS = 450
# Hybrid retrieval (docs/feature-research.md section 5.3, D-035). Each search
# keeps its best RETRIEVAL_CANDIDATES chunks before reciprocal rank fusion with
# constant RRF_K. RETRIEVAL_MIN_SIMILARITY drops embedding candidates an
# unrelated query would otherwise return; 0.4 is provisional, measured on
# calibration queries, to recalibrate on the evaluation question set.
# French stemming with accents folded first (migration b5d8e2a4c617, D-036).
CORPUS_TEXT_SEARCH_CONFIG = "chahed_french"
RETRIEVAL_CANDIDATES = 20
RRF_K = 60
RETRIEVAL_MIN_SIMILARITY = 0.4
# Full-text query terms shorter than this are dropped (D-037).
TEXT_QUERY_MIN_LEXEME_CHARS = 3
# Retrieval evaluation (docs/feature-research.md section 5.8): recall@5 on the
# question set people wrote must reach the target before related texts and
# legal search ship to the UI. 0.9 is the plan's proposal until the team fixes one.
RETRIEVAL_EVAL_TOP_K = 5
RETRIEVAL_RECALL_TARGET = 0.9
EVAL_QUESTIONS_PATH = "../corpus/eval/questions.json"
# Sign-in (A3). A session stops being accepted this long after it was opened.
# Password bounds follow NIST SP 800-63B: at least 8 characters, long passphrases allowed.
SESSION_TTL_HOURS = 12
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 256
# Phone capture (G3, D-056). A capture link a laptop shows as a QR code stops
# working this long after it was made, or once one document is filed through it.
CAPTURE_LINK_TTL_MINUTES = 10


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            "Identity values have no default and no fallback."
        )
    return value


@dataclass(frozen=True)
class Settings:
    """Process configuration, loaded once at startup from the environment."""

    database_url: str
    document_storage_dir: str
    embedding_dimensions: int
    schemas_dir: str
    rules_dir: str
    corpus_sources_dir: str
    verified_passages_path: str
    openrouter_api_key: str
    openrouter_model_id: str


def load_settings() -> Settings:
    """Read and validate every environment variable this process needs."""
    return Settings(
        database_url=_require("DATABASE_URL"),
        document_storage_dir=os.environ.get(
            "DOCUMENT_STORAGE_DIR", DOCUMENT_STORAGE_DIR_DEFAULT
        ),
        embedding_dimensions=int(
            os.environ.get("EMBEDDING_DIMENSIONS", EMBEDDING_DIMENSIONS_DEFAULT)
        ),
        schemas_dir=os.environ.get("SCHEMAS_DIR", SCHEMAS_DIR_DEFAULT),
        rules_dir=os.environ.get("RULES_DIR", RULES_DIR_DEFAULT),
        corpus_sources_dir=os.environ.get(
            "CORPUS_SOURCES_DIR", CORPUS_SOURCES_DIR_DEFAULT
        ),
        verified_passages_path=os.environ.get(
            "VERIFIED_PASSAGES_PATH", VERIFIED_PASSAGES_PATH_DEFAULT
        ),
        openrouter_api_key=_require("OPENROUTER_API_KEY"),
        openrouter_model_id=_require("OPENROUTER_MODEL_ID"),
    )


settings = load_settings()
