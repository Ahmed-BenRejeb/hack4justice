"""FastAPI dependencies that authenticate a request and gate it by role and organisation (A3).

Every route except health, sign-up and sign-in depends on one of these. A
request without a valid session answers 401, a role that may not use the route
403, and a document outside the user's organisations 404, exactly like a
missing one, so a filer cannot learn which document ids exist elsewhere. The
phone capture routes take a capture link in place of a session (G3, D-056).
"""

import uuid
from collections.abc import Callable

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.capture import usable_capture_link
from app.auth.service import FILER_ROLES, session_user
from app.db.models import CaptureLink, Document, User
from app.db.session import get_db

bearer = HTTPBearer(auto_error=False)


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """The signed-in user, or 401."""
    user = session_user(db, credentials.credentials) if credentials else None
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="not signed in",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def _require_role(*roles: str) -> Callable[..., User]:
    def dependency(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=403, detail="this role may not use this route"
            )
        return user

    return dependency


# One instance per gate, so a router-level gate and an endpoint that also reads the
# user resolve to the same dependency and FastAPI runs it once per request.
require_filer = _require_role(*FILER_ROLES)
require_officer = _require_role("officer")
require_admin = _require_role("admin")


def member_of(user: User, organisation_id: uuid.UUID) -> bool:
    """Whether `user` files for this organisation. Officers and admins file for none."""
    return any(
        organisation.id == organisation_id for organisation in user.organisations
    )


def readable_document(
    document_id: uuid.UUID,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> Document:
    """The path's document, if this user may read it: an officer reads every file, a filer their organisations' files."""
    document = db.get(Document, document_id)
    if document is None or not (
        user.role == "officer" or member_of(user, document.organisation_id)
    ):
        raise HTTPException(status_code=404, detail="document not found")
    return document


def _capture_link_gate(*, lock: bool) -> Callable[..., CaptureLink]:
    def dependency(token: str, db: Session = Depends(get_db)) -> CaptureLink:
        link = usable_capture_link(db, token, lock=lock)
        # A maker who no longer files for the organisation cannot file through an older link either.
        if link is None or not member_of(link.user, link.organisation_id):
            raise HTTPException(status_code=404, detail="capture link not found")
        return link

    return dependency


# The path's capture link while it is unexpired and unused; 404 otherwise, like a missing one.
readable_capture_link = _capture_link_gate(lock=False)
# The same, its row locked until the upload commits, so one link files one document.
capture_link_for_upload = _capture_link_gate(lock=True)
