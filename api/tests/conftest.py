"""Shared test fixtures. Requires the docker-compose Postgres instance running."""

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import engine


@pytest.fixture(autouse=True)
def _clean_schema() -> None:
    """Recreate every table fresh for each test."""
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)


@pytest.fixture
def db() -> Session:
    session = Session(bind=engine)
    try:
        yield session
    finally:
        session.close()
