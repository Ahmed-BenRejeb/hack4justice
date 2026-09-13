"""corpus chunk full text search

Revision ID: 9e4b6f2c8d13
Revises: 7c2d9e3a41b5
Create Date: 2026-09-13 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '9e4b6f2c8d13'
down_revision: Union[str, Sequence[str], None] = '7c2d9e3a41b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
    op.add_column('corpus_chunk', sa.Column('text_search', postgresql.TSVECTOR(), nullable=True))
    # Chunks indexed before this revision get their index from their stored text,
    # the same expression the loader uses.
    op.execute("UPDATE corpus_chunk SET text_search = to_tsvector('french', unaccent(text))")
    op.alter_column('corpus_chunk', 'text_search', nullable=False)
    op.create_index('ix_corpus_chunk_text_search', 'corpus_chunk', ['text_search'], unique=False, postgresql_using='gin')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_corpus_chunk_text_search', table_name='corpus_chunk', postgresql_using='gin')
    op.drop_column('corpus_chunk', 'text_search')
