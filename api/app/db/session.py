"""Database engine and per-request session for FastAPI dependency injection."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """Yield a database session, closed after the request completes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
