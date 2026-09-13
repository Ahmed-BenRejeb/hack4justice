"""supplier confirmed facts

Revision ID: d8f3b0c65e41
Revises: c1e7a3f5b920
Create Date: 2026-09-13 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd8f3b0c65e41'
down_revision: Union[str, Sequence[str], None] = 'c1e7a3f5b920'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'supplier_fact',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organisation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('supplier_tax_id', sa.String(length=50), nullable=False),
        sa.Column('fact_name', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('confirmed_by', sa.String(length=255), nullable=False),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('valid_until', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisation.id'], ),
        sa.PrimaryKeyConstraint('id'),
        # One current value per organisation, supplier and fact: confirming again replaces it.
        sa.UniqueConstraint('organisation_id', 'supplier_tax_id', 'fact_name', name='uq_supplier_fact_organisation_supplier_name'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('supplier_fact')
