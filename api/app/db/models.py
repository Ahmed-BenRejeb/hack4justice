"""SQLAlchemy models for the data model specified in docs/architecture.md section 4.

Table and column names follow that document. It is binding: a change here
without a corresponding change there is a bug in one of the two.
"""

import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.config import settings
from app.db.base import Base


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class Organisation(Base):
    """An MSME or the administration side."""

    __tablename__ = "organisation"

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    tax_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    kind: Mapped[str] = mapped_column(
        Enum("msme", "administration", name="organisation_kind", native_enum=False),
        nullable=False,
    )


class Document(Base):
    """The raw uploaded file."""

    __tablename__ = "document"

    id: Mapped[uuid.UUID] = _uuid_pk()
    organisation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organisation.id"), nullable=False
    )
    uploaded_by: Mapped[str] = mapped_column(String(255), nullable=False)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_ref: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    organisation: Mapped["Organisation"] = relationship()


class Extraction(Base):
    """One structured field pulled from a document."""

    __tablename__ = "extraction"

    id: Mapped[uuid.UUID] = _uuid_pk()
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("document.id"), nullable=False
    )
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(nullable=False)
    source: Mapped[str] = mapped_column(
        Enum("extracted", "assisted", name="extraction_source", native_enum=False),
        nullable=False,
    )
    extracted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class CorpusSource(Base):
    """An official document the corpus is indexed from, with the provenance shown next to its text."""

    __tablename__ = "corpus_source"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    edition: Mapped[str] = mapped_column(String(50), nullable=False)
    publisher: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, nullable=False)
    loaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class CorpusChunk(Base):
    """Paragraph- or item-level legal text, embedded, with its position in the source."""

    __tablename__ = "corpus_chunk"
    # Re-indexing a source updates chunks in place, so chunk ids stay stable.
    __table_args__ = (
        UniqueConstraint(
            "source_id",
            "article_ref",
            "paragraph_ref",
            "char_start",
            name="uq_corpus_chunk_position",
        ),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    source_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("corpus_source.id"), nullable=False
    )
    article_ref: Mapped[str] = mapped_column(String(100), nullable=False)
    paragraph_ref: Mapped[str] = mapped_column(String(100), nullable=False)
    heading_path: Mapped[str] = mapped_column(String(500), nullable=False)
    page: Mapped[int] = mapped_column(Integer, nullable=False)
    char_start: Mapped[int] = mapped_column(Integer, nullable=False)
    char_end: Mapped[int] = mapped_column(Integer, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    text_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    embedding: Mapped[list[float]] = mapped_column(
        Vector(settings.embedding_dimensions), nullable=True
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)


class Rule(Base):
    """A rule registry entry: a verbatim citation plus a pointer to the deterministic logic."""

    __tablename__ = "rule"

    id: Mapped[uuid.UUID] = _uuid_pk()
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    citation_source: Mapped[str] = mapped_column(String(255), nullable=False)
    article_ref: Mapped[str] = mapped_column(String(100), nullable=False)
    verbatim_text: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    logic_ref: Mapped[str] = mapped_column(String(255), nullable=False)


class Finding(Base):
    """One evaluation outcome per rule per document. 'abstained' is a normal outcome, not an error."""

    __tablename__ = "finding"

    id: Mapped[uuid.UUID] = _uuid_pk()
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("document.id"), nullable=False
    )
    rule_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rule.id"), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("decided", "abstained", name="finding_status", native_enum=False),
        nullable=False,
    )
    decided_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    missing_fact: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Citation(Base):
    """Join surface so a finding's citation is always resolvable in one query."""

    __tablename__ = "citation"

    id: Mapped[uuid.UUID] = _uuid_pk()
    finding_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("finding.id"), nullable=False
    )
    rule_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rule.id"), nullable=False)


class CounterpartyCheck(Base):
    """Registration facts only, no score field, per D-007."""

    __tablename__ = "counterparty_check"

    id: Mapped[uuid.UUID] = _uuid_pk()
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("document.id"), nullable=False
    )
    rne_id: Mapped[str] = mapped_column(String(100), nullable=False)
    registered: Mapped[bool] = mapped_column(Boolean, nullable=False)
    identifiers_match: Mapped[bool] = mapped_column(Boolean, nullable=False)
    status_text: Mapped[str] = mapped_column(String(255), nullable=False)


class OfficerDecision(Base):
    """The one human-authority step before export."""

    __tablename__ = "officer_decision"

    id: Mapped[uuid.UUID] = _uuid_pk()
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("document.id"), nullable=False
    )
    officer_id: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(
        Enum("validated", "flagged", name="officer_decision_action", native_enum=False),
        nullable=False,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Export(Base):
    """Produced only after officer_decision.action == 'validated'."""

    __tablename__ = "export"

    id: Mapped[uuid.UUID] = _uuid_pk()
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("document.id"), nullable=False
    )
    xml_ref: Mapped[str] = mapped_column(String(500), nullable=False)
    xsd_validated: Mapped[bool] = mapped_column(Boolean, nullable=False)
    validated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class AuditEntry(Base):
    """Append-only trail across the pipeline."""

    __tablename__ = "audit_entry"

    id: Mapped[uuid.UUID] = _uuid_pk()
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    actor: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
