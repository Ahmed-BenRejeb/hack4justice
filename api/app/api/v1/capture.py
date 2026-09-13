"""Phone capture through a QR code (G3, D-056).

A signed-in filer's laptop makes a capture link and shows it as a QR code. The
phone that opens it files one document for that user and organisation without
signing in; the laptop polls the link and opens the review once it is filed.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.documents import file_document
from app.auth.capture import open_capture_link
from app.auth.deps import (
    capture_link_for_upload,
    member_of,
    readable_capture_link,
    require_filer,
)
from app.db.models import CaptureLink, User
from app.db.session import get_db

router = APIRouter(prefix="/capture", tags=["capture"])


class CaptureLinkOut(BaseModel):
    id: uuid.UUID
    expires_at: datetime
    document_id: uuid.UUID | None

    model_config = {"from_attributes": True}


class CaptureLinkCreatedOut(CaptureLinkOut):
    """A new link. Its token is returned here only; the database keeps its hash."""

    token: str


class CaptureInviteOut(BaseModel):
    """What the phone shows before taking photos."""

    organisation_name: str
    expires_at: datetime


class CapturedDocumentOut(BaseModel):
    filename: str
    status: str


@router.post("/links", response_model=CaptureLinkCreatedOut, status_code=201)
def create_capture_link(
    organisation_id: uuid.UUID,
    user: User = Depends(require_filer),
    db: Session = Depends(get_db),
) -> CaptureLinkCreatedOut:
    """Make a link a phone opens to file one document for the signed-in user and this organisation."""
    if not member_of(user, organisation_id):
        raise HTTPException(status_code=404, detail="organisation not found")
    token, link = open_capture_link(db, user, organisation_id)
    created = CaptureLinkCreatedOut(
        **CaptureLinkOut.model_validate(link).model_dump(), token=token
    )
    db.commit()
    return created


@router.get("/links/{link_id}", response_model=CaptureLinkOut)
def get_capture_link(
    link_id: uuid.UUID,
    user: User = Depends(require_filer),
    db: Session = Depends(get_db),
) -> CaptureLink:
    """A link the signed-in user made, with the document filed through it once there is one."""
    link = db.get(CaptureLink, link_id)
    if link is None or link.user_id != user.id:
        raise HTTPException(status_code=404, detail="capture link not found")
    return link


@router.get("/{token}", response_model=CaptureInviteOut)
def get_capture_invite(
    link: CaptureLink = Depends(readable_capture_link),
) -> CaptureInviteOut:
    """The organisation an unexpired, unused link files for. No session: the token is the permission."""
    return CaptureInviteOut(
        organisation_name=link.organisation.name, expires_at=link.expires_at
    )


@router.post("/{token}/documents", response_model=CapturedDocumentOut, status_code=201)
async def file_captured_document(
    file: list[UploadFile],
    link: CaptureLink = Depends(capture_link_for_upload),
    db: Session = Depends(get_db),
) -> CapturedDocumentOut:
    """File the phone's photos as one document for the link's maker, which ends the link."""
    document = await file_document(db, link.organisation_id, link.user.email, file)
    link.document_id = document.id
    db.commit()
    return CapturedDocumentOut(filename=document.filename, status=document.status)
