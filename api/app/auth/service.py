"""Accounts and sessions (A3): who may sign in, with which role, filing for which organisations.

A session token is random and handed to the client once; only its SHA-256 is
stored, so reading the database does not let anyone sign in.
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from functools import cache

from sqlalchemy.orm import Session

from app.auth.passwords import hash_password, verify_password
from app.config import PASSWORD_MIN_LENGTH, SESSION_TTL_HOURS
from app.db.models import Organisation, User, UserSession

ROLES = ("msme", "accountant", "officer", "admin")
# Roles that file documents for an organisation. Officers and admins act for the administration.
FILER_ROLES = ("msme", "accountant")


class AccountError(ValueError):
    """An account that cannot be created as asked."""


class DuplicateEmail(AccountError):
    """An account already uses this email."""


def normalise_email(email: str) -> str:
    """Emails are compared without surrounding spaces or case."""
    return email.strip().lower()


def _check_organisations(role: str, organisations: list[Organisation]) -> None:
    if role not in ROLES:
        raise AccountError(f"unknown role: {role}")
    if role == "msme" and len(organisations) != 1:
        raise AccountError("an msme user files for exactly one organisation")
    if role == "accountant" and not organisations:
        raise AccountError("an accountant files for at least one organisation")
    if role not in FILER_ROLES and organisations:
        raise AccountError(f"an {role} files for no organisation")


def create_user(
    db: Session,
    *,
    email: str,
    password: str,
    role: str,
    organisations: list[Organisation],
) -> User:
    """Add a user, enforcing the password length and the organisations each role holds.

    An MSME user files for exactly one organisation, an accountant for at
    least one (A4), an officer or admin for none.
    """
    _check_organisations(role, organisations)
    if len(password) < PASSWORD_MIN_LENGTH:
        raise AccountError(
            f"a password needs at least {PASSWORD_MIN_LENGTH} characters"
        )
    email = normalise_email(email)
    if db.query(User).filter_by(email=email).one_or_none() is not None:
        raise DuplicateEmail("an account with this email already exists")

    user = User(
        email=email,
        password_hash=hash_password(password),
        role=role,
        organisations=organisations,
    )
    db.add(user)
    db.flush()
    return user


@cache
def _unknown_user_hash() -> str:
    return hash_password(secrets.token_urlsafe(16))


def authenticate(db: Session, email: str, password: str) -> User | None:
    """The user these credentials belong to, or None."""
    user = db.query(User).filter_by(email=normalise_email(email)).one_or_none()
    # An unknown email still costs one hash, so response time does not reveal which emails have accounts.
    stored = user.password_hash if user is not None else _unknown_user_hash()
    if not verify_password(password, stored):
        return None
    return user


def _digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def open_session(db: Session, user: User) -> tuple[str, UserSession]:
    """Start a session for `user`; returns the token, which is not stored, and the session row."""
    token = secrets.token_urlsafe(32)
    session = UserSession(
        token_sha256=_digest(token),
        user_id=user.id,
        expires_at=datetime.now(UTC) + timedelta(hours=SESSION_TTL_HOURS),
    )
    db.add(session)
    db.flush()
    return token, session


def session_user(db: Session, token: str) -> User | None:
    """The user of an unexpired session with this token, or None."""
    # ponytail: expired rows are ignored, not deleted; add a periodic purge if the table grows.
    session = (
        db.query(UserSession)
        .filter(
            UserSession.token_sha256 == _digest(token),
            UserSession.expires_at > datetime.now(UTC),
        )
        .one_or_none()
    )
    return session.user if session is not None else None


def close_session(db: Session, token: str) -> None:
    """End the session with this token, if any."""
    db.query(UserSession).filter_by(token_sha256=_digest(token)).delete()
