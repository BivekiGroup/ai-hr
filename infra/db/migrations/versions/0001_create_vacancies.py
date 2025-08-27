from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_create_vacancies'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'vacancies',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('seniority', sa.String(length=32), nullable=False),
        sa.Column('skills', sa.JSON(), nullable=False),
        sa.Column('weights', sa.JSON(), nullable=False),
        sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_vacancies_id', 'vacancies', ['id'])


def downgrade() -> None:
    op.drop_index('ix_vacancies_id', table_name='vacancies')
    op.drop_table('vacancies')

