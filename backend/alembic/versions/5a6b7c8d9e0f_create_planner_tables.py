"""create planner tables

Revision ID: 5a6b7c8d9e0f
Revises: 4a5b6c7d8e9f
Create Date: 2026-07-04 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '5a6b7c8d9e0f'
down_revision: Union[str, None] = '4a5b6c7d8e9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create study_plans table
    op.create_table(
        'study_plans',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('goal', sa.String(length=500), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('hours_per_day', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_study_plans_id'), 'study_plans', ['id'], unique=False)
    op.create_index(op.f('ix_study_plans_user_id'), 'study_plans', ['user_id'], unique=False)

    # Create study_days table
    op.create_table(
        'study_days',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('study_plan_id', sa.Uuid(), nullable=False),
        sa.Column('day_number', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('topic', sa.String(length=500), nullable=False),
        sa.Column('estimated_hours', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['study_plan_id'], ['study_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_study_days_id'), 'study_days', ['id'], unique=False)
    op.create_index(op.f('ix_study_days_study_plan_id'), 'study_days', ['study_plan_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_study_days_study_plan_id'), table_name='study_days')
    op.drop_index(op.f('ix_study_days_id'), table_name='study_days')
    op.drop_table('study_days')
    op.drop_index(op.f('ix_study_plans_user_id'), table_name='study_plans')
    op.drop_index(op.f('ix_study_plans_id'), table_name='study_plans')
    op.drop_table('study_plans')
