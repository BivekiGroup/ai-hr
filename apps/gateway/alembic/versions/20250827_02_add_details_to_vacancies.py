"""add details column to vacancies

Revision ID: 20250827_02
Revises: 20250827_01_add_status_to_vacancies
Create Date: 2025-08-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20250827_02'
down_revision: Union[str, None] = '20250827_01_add_status_to_vacancies'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('vacancies', sa.Column('details', sa.JSON(), nullable=False, server_default=sa.text("'{}'")))
    # Drop default so application controls the value
    op.alter_column('vacancies', 'details', server_default=None)


def downgrade() -> None:
    op.drop_column('vacancies', 'details')

