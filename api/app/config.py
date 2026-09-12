"""The only module in api/ that reads os.environ, per the root CLAUDE.md configuration rule."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()

DOCUMENT_STORAGE_DIR_DEFAULT = "./data/documents"
EMBEDDING_DIMENSIONS_DEFAULT = 384


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
        openrouter_api_key=_require("OPENROUTER_API_KEY"),
        openrouter_model_id=_require("OPENROUTER_MODEL_ID"),
    )


settings = load_settings()
