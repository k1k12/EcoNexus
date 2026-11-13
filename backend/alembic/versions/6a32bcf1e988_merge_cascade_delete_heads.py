"""merge cascade delete heads

Revision ID: 6a32bcf1e988
Revises: 2868a6e52046, 540b30a196d6
Create Date: 2026-11-13 22:02:57.549553

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6a32bcf1e988'
down_revision = ('2868a6e52046', '540b30a196d6')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
