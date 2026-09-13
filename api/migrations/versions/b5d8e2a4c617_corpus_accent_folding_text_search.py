"""corpus accent folding text search

Revision ID: b5d8e2a4c617
Revises: 9e4b6f2c8d13
Create Date: 2026-09-13 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b5d8e2a4c617'
down_revision: Union[str, Sequence[str], None] = '9e4b6f2c8d13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _recreate_text_search_index() -> None:
    op.create_index('ix_corpus_chunk_text_search', 'corpus_chunk', ['text_search'], unique=False, postgresql_using='gin')


def upgrade() -> None:
    """Upgrade schema."""
    # Accents are folded inside the configuration, before French stemming, so the
    # stored text keeps its accents and ts_headline marks "hôtels" for "hotels".
    op.execute("CREATE TEXT SEARCH CONFIGURATION chahed_french (COPY = french)")
    op.execute("ALTER TEXT SEARCH CONFIGURATION chahed_french ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem")
    op.drop_index('ix_corpus_chunk_text_search', table_name='corpus_chunk', postgresql_using='gin')
    op.drop_column('corpus_chunk', 'text_search')
    # With an explicit configuration to_tsvector is immutable, so the column is generated.
    op.add_column('corpus_chunk', sa.Column('text_search', postgresql.TSVECTOR(), sa.Computed("to_tsvector('chahed_french'::regconfig, text)", persisted=True), nullable=False))
    _recreate_text_search_index()


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_corpus_chunk_text_search', table_name='corpus_chunk', postgresql_using='gin')
    op.drop_column('corpus_chunk', 'text_search')
    op.add_column('corpus_chunk', sa.Column('text_search', postgresql.TSVECTOR(), nullable=True))
    op.execute("UPDATE corpus_chunk SET text_search = to_tsvector('french', unaccent(text))")
    op.alter_column('corpus_chunk', 'text_search', nullable=False)
    _recreate_text_search_index()
    op.execute("DROP TEXT SEARCH CONFIGURATION chahed_french")
