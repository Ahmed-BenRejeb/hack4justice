"""corpus chunk verification

Revision ID: 7c2d9e3a41b5
Revises: 5b8e1c4f9a02
Create Date: 2026-09-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c2d9e3a41b5'
down_revision: Union[str, Sequence[str], None] = '5b8e1c4f9a02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('corpus_chunk', sa.Column('verification_status', sa.Enum('unverified', 'verified', name='verification_status', native_enum=False), server_default='unverified', nullable=False))
    op.add_column('corpus_chunk', sa.Column('verified_by', sa.String(length=255), nullable=True))
    op.add_column('corpus_chunk', sa.Column('verified_on', sa.Date(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('corpus_chunk', 'verified_on')
    op.drop_column('corpus_chunk', 'verified_by')
    op.drop_column('corpus_chunk', 'verification_status')
