"""corpus sources and paragraph chunks

Revision ID: 5b8e1c4f9a02
Revises: a3f9c2d17b64
Create Date: 2026-09-13 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b8e1c4f9a02'
down_revision: Union[str, Sequence[str], None] = 'a3f9c2d17b64'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_CHUNK_COLUMNS = (
    ('paragraph_ref', sa.String(length=100)),
    ('heading_path', sa.String(length=500)),
    ('page', sa.Integer()),
    ('char_start', sa.Integer()),
    ('char_end', sa.Integer()),
    ('token_count', sa.Integer()),
    ('text_sha256', sa.String(length=64)),
)


def upgrade() -> None:
    """Upgrade schema."""
    # Article-level chunks are derived data with no source row to point at;
    # app.corpus.load_corpus rebuilds them at paragraph level.
    op.execute("DELETE FROM corpus_chunk")
    op.create_table('corpus_source',
    sa.Column('id', sa.String(length=255), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('edition', sa.String(length=50), nullable=False),
    sa.Column('publisher', sa.String(length=255), nullable=False),
    sa.Column('url', sa.String(length=500), nullable=False),
    sa.Column('sha256', sa.String(length=64), nullable=False),
    sa.Column('language', sa.String(length=10), nullable=False),
    sa.Column('page_count', sa.Integer(), nullable=False),
    sa.Column('loaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    for name, column_type in NEW_CHUNK_COLUMNS:
        op.add_column('corpus_chunk', sa.Column(name, column_type, nullable=False))
    op.create_foreign_key('corpus_chunk_source_id_fkey', 'corpus_chunk', 'corpus_source', ['source_id'], ['id'])
    op.create_unique_constraint('uq_corpus_chunk_position', 'corpus_chunk', ['source_id', 'article_ref', 'paragraph_ref', 'char_start'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_corpus_chunk_position', 'corpus_chunk', type_='unique')
    op.drop_constraint('corpus_chunk_source_id_fkey', 'corpus_chunk', type_='foreignkey')
    for name, _ in NEW_CHUNK_COLUMNS:
        op.drop_column('corpus_chunk', name)
    op.drop_table('corpus_source')
