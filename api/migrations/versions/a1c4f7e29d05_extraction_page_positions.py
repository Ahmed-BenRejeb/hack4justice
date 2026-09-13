"""extraction page positions

Revision ID: a1c4f7e29d05
Revises: f2a7d4e88b13
Create Date: 2026-09-13 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1c4f7e29d05'
down_revision: Union[str, Sequence[str], None] = 'f2a7d4e88b13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'document_page',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('page', sa.Integer(), nullable=False),
        sa.Column('image_ref', sa.String(length=500), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['document.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_id', 'page', name='uq_document_page'),
    )
    # Where on the document a field's value was found (J3): null for full_text/
    # masked_text and for any field app/extraction/positions.py could not
    # locate exactly.
    op.add_column('extraction', sa.Column('page', sa.Integer(), nullable=True))
    op.add_column('extraction', sa.Column('bbox', postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('extraction', 'bbox')
    op.drop_column('extraction', 'page')
    op.drop_table('document_page')
