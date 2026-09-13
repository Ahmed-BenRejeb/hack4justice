"""capture links for phone capture through a QR code

Revision ID: 8a4c2f6e1d39
Revises: e6b1c9d4a7f2
Create Date: 2026-09-13 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '8a4c2f6e1d39'
down_revision: Union[str, Sequence[str], None] = 'e6b1c9d4a7f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'capture_link',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_sha256', sa.String(length=64), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['app_user.id'], ),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisation.id'], ),
        sa.ForeignKeyConstraint(['document_id'], ['document.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_sha256'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('capture_link')
