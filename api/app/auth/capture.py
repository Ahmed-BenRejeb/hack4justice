"""Capture links (G3, D-056): a signed-in filer lets a phone file one document without signing in.

The laptop shows the link as a QR code. Like a session token, the link's token
is random, handed out once, and only its SHA-256 is stored.
"""

import secrets
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.auth.service import digest_token
from app.config import CAPTURE_LINK_TTL_MINUTES
from app.db.models import CaptureLink, User


def open_capture_link(
    db: Session, user: User, organisation_id: uuid.UUID
) -> tuple[str, CaptureLink]:
    """Make a link filing for `user` and one of their organisations; returns the token, which is not stored, and the row."""
    token = secrets.token_urlsafe(32)
    link = CaptureLink(
        token_sha256=digest_token(token),
        user_id=user.id,
        organisation_id=organisation_id,
        expires_at=datetime.now(UTC) + timedelta(minutes=CAPTURE_LINK_TTL_MINUTES),
    )
    db.add(link)
    db.flush()
    return token, link


def usable_capture_link(
    db: Session, token: str, *, lock: bool = False
) -> CaptureLink | None:
    """The unexpired link with this token that no document was filed through yet, or None.

    With `lock`, the row stays locked until the transaction ends, so two uploads
    through one link cannot both file: the second waits, then finds it used.
    """
    query = db.query(CaptureLink).filter(
        CaptureLink.token_sha256 == digest_token(token),
        CaptureLink.expires_at > datetime.now(UTC),
        CaptureLink.document_id.is_(None),
    )
    if lock:
        query = query.with_for_update()
    return query.one_or_none()
