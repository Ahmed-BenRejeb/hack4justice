"""rule error codes

Revision ID: f2a7d4e88b13
Revises: d8f3b0c65e41
Create Date: 2026-09-13 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f2a7d4e88b13'
down_revision: Union[str, Sequence[str], None] = 'd8f3b0c65e41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # A rule that declares no error code counts no intercepted error, rather than
    # having one guessed from its code names.
    op.add_column('rule', sa.Column('error_codes', postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('rule', 'error_codes')
