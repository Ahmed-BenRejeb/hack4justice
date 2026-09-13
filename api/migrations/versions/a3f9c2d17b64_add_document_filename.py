"""add document filename

Revision ID: a3f9c2d17b64
Revises: d45ee6d2b0f6
Create Date: 2026-09-12 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f9c2d17b64'
down_revision: Union[str, Sequence[str], None] = 'd45ee6d2b0f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Rows uploaded before this column existed keep their storage ref as the name,
    # so the column can be NOT NULL without inventing a filename.
    op.add_column('document', sa.Column('filename', sa.String(length=500), nullable=True))
    op.execute("UPDATE document SET filename = storage_ref")
    op.alter_column('document', 'filename', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('document', 'filename')
