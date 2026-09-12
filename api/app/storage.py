"""Local filesystem storage for uploaded documents."""

import uuid
from pathlib import Path

from app.config import settings


def save_upload(filename: str, content: bytes) -> str:
    """Write an uploaded file's bytes to storage and return its storage reference."""
    extension = Path(filename).suffix
    storage_ref = f"{uuid.uuid4()}{extension}"
    target_dir = Path(settings.document_storage_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / storage_ref).write_bytes(content)
    return storage_ref
