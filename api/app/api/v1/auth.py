"""Sign-up, sign-in, sign-out, and the signed-in user (A3).

Self sign-up creates an MSME, its first user and a session in one step, which
replaces the organisation picker the upload screen needed before sign-in
existed (D-024). Officer, admin and accountant accounts are created with
`python -m app.auth.create_user`: those roles act for the administration or for
several organisations, which a public form must not grant.

The session token travels as a bearer token. The web app keeps it in an
HttpOnly cookie on its own origin and forwards it, so browser code never reads it.
"""

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy.orm import Session

from app.auth.deps import bearer, current_user
from app.auth.service import (
    DuplicateEmail,
    authenticate,
    close_session,
    create_user,
    open_session,
)
from app.config import PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH
from app.db.models import Organisation, User
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

# Shape only; whether the address works is not checked, since no email is ever sent.
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class OrganisationIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    tax_id: str = Field(min_length=1, max_length=50)

    model_config = {"str_strip_whitespace": True}


class OrganisationOut(BaseModel):
    id: uuid.UUID
    name: str
    tax_id: str
    kind: str

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    organisations: list[OrganisationOut]

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    """A new session. The token appears in this response only; its SHA-256 is what is stored."""

    token: str
    expires_at: datetime
    user: UserOut


class SignInIn(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(max_length=PASSWORD_MAX_LENGTH)


class SignUpIn(BaseModel):
    # Stripped before the pattern applies; the password is never stripped.
    email: Annotated[
        str,
        StringConstraints(strip_whitespace=True, pattern=EMAIL_PATTERN, max_length=255),
    ]
    password: str = Field(
        min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH
    )
    organisation: OrganisationIn


def _session_out(db: Session, user: User) -> SessionOut:
    token, session = open_session(db, user)
    db.commit()
    return SessionOut(
        token=token, expires_at=session.expires_at, user=UserOut.model_validate(user)
    )


@router.post("/signup", response_model=SessionOut, status_code=201)
def sign_up(payload: SignUpIn, db: Session = Depends(get_db)) -> SessionOut:
    """Create an MSME and its first user, and sign that user in.

    A tax id identifies one organisation, so a taken one is a conflict, as is a
    taken email. Nothing here proves the person runs the organisation they
    name; that needs a verified identity (DigiGo, A3's later step).
    """
    tax_id = payload.organisation.tax_id
    if db.query(Organisation).filter_by(tax_id=tax_id).one_or_none() is not None:
        raise HTTPException(
            status_code=409, detail="an organisation with this tax id already exists"
        )
    organisation = Organisation(
        name=payload.organisation.name, tax_id=tax_id, kind="msme"
    )
    db.add(organisation)
    try:
        user = create_user(
            db,
            email=payload.email,
            password=payload.password,
            role="msme",
            organisations=[organisation],
        )
    except DuplicateEmail as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return _session_out(db, user)


@router.post("/login", response_model=SessionOut)
def sign_in(payload: SignInIn, db: Session = Depends(get_db)) -> SessionOut:
    """Open a session for valid credentials. One message for both a wrong email and a wrong password."""
    user = authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="email or password is incorrect")
    return _session_out(db, user)


@router.post("/logout", status_code=204)
def sign_out(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    _: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> None:
    """End the session this request was made with."""
    close_session(db, credentials.credentials)
    db.commit()


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> User:
    """The signed-in user, their role and the organisations they file for."""
    return user
