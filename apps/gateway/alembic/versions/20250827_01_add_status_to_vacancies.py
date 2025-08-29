from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250827_01'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('vacancies') as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=32), nullable=False, server_default='draft'))

    # Remove server_default to keep model-driven defaults only
    with op.batch_alter_table('vacancies') as batch_op:
        batch_op.alter_column('status', server_default=None)


def downgrade() -> None:
    with op.batch_alter_table('vacancies') as batch_op:
        batch_op.drop_column('status')

