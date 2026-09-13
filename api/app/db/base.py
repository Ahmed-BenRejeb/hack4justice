"""Declarative base shared by every model, and the single metadata target for Alembic."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
