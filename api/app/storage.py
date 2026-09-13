"""Local filesystem storage for uploaded documents and their rendered pages."""

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


def save_page_image(document_id: uuid.UUID, page: int, content: bytes) -> str:
    """Write one rendered page (PNG) to storage and return its storage reference (J3)."""
    storage_ref = f"pages/{document_id}-{page}.png"
    target_path = Path(settings.document_storage_dir) / storage_ref
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_bytes(content)
    return storage_ref


def read_file(storage_ref: str) -> bytes:
    """Read back a file's bytes from its storage reference."""
    return (Path(settings.document_storage_dir) / storage_ref).read_bytes()
