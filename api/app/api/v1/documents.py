"""Document upload endpoint. Persists the file and its record; extraction is not wired yet."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import Document, Organisation
from app.db.session import get_db
from app.storage import save_upload

router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentOut(BaseModel):
    id: uuid.UUID
    organisation_id: uuid.UUID
    uploaded_by: str
    storage_ref: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile,
    organisation_id: uuid.UUID,
    uploaded_by: str,
    db: Session = Depends(get_db),
) -> Document:
    """Store an uploaded file and record it as a document with status 'uploaded'."""
    organisation = db.get(Organisation, organisation_id)
    if organisation is None:
        raise HTTPException(status_code=404, detail="organisation not found")

    content = await file.read()
    storage_ref = save_upload(file.filename or "document", content)

    document = Document(
        organisation_id=organisation_id,
        uploaded_by=uploaded_by,
        storage_ref=storage_ref,
        status="uploaded",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document
