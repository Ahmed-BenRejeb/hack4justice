"""finding decision trace

Revision ID: c1e7a3f5b920
Revises: b5d8e2a4c617
Create Date: 2026-09-13 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c1e7a3f5b920'
down_revision: Union[str, Sequence[str], None] = 'b5d8e2a4c617'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Findings recorded before the trace existed keep an empty one, never a guessed one.
    op.add_column('finding', sa.Column('trace', postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('finding', 'trace')
