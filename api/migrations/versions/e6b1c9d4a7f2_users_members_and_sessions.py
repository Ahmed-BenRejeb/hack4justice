"""users, organisation members and sessions

Revision ID: e6b1c9d4a7f2
Revises: f2a7d4e88b13
Create Date: 2026-09-13 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e6b1c9d4a7f2'
down_revision: Union[str, Sequence[str], None] = 'f2a7d4e88b13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'app_user',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('msme', 'accountant', 'officer', 'admin', name='user_role', native_enum=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_table(
        'organisation_member',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['app_user.id'], ),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisation.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'organisation_id'),
    )
    op.create_table(
        'user_session',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_sha256', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['app_user.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_sha256'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user_session')
    op.drop_table('organisation_member')
    op.drop_table('app_user')
