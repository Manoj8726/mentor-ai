"""create progress tables

Revision ID: 7a8b9c0d1e2f
Revises: 6a7b8c9d0e1f
Create Date: 2026-07-05 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7a8b9c0d1e2f'
down_revision: Union[str, None] = '6a7b8c9d0e1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create learning_analytics table
    op.create_table(
        'learning_analytics',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('study_completion_percentage', sa.Float(), nullable=False),
        sa.Column('interview_score', sa.Float(), nullable=False),
        sa.Column('resume_score', sa.Float(), nullable=False),
        sa.Column('knowledge_base_usage', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_learning_analytics_id'), 'learning_analytics', ['id'], unique=False)
    op.create_index(op.f('ix_learning_analytics_user_id'), 'learning_analytics', ['user_id'], unique=False)

    # Create weak_topics table
    op.create_table(
        'weak_topics',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('topic', sa.String(length=255), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('source', sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_weak_topics_id'), 'weak_topics', ['id'], unique=False)
    op.create_index(op.f('ix_weak_topics_user_id'), 'weak_topics', ['user_id'], unique=False)

    # Create recommendations table
    op.create_table(
        'recommendations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_recommendations_id'), 'recommendations', ['id'], unique=False)
    op.create_index(op.f('ix_recommendations_user_id'), 'recommendations', ['user_id'], unique=False)

    # Create study_streaks table
    op.create_table(
        'study_streaks',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('current_streak', sa.Integer(), nullable=False),
        sa.Column('longest_streak', sa.Integer(), nullable=False),
        sa.Column('last_active_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_study_streaks_id'), 'study_streaks', ['id'], unique=False)
    op.create_index(op.f('ix_study_streaks_user_id'), 'study_streaks', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_study_streaks_user_id'), table_name='study_streaks')
    op.drop_index(op.f('ix_study_streaks_id'), table_name='study_streaks')
    op.drop_table('study_streaks')

    op.drop_index(op.f('ix_recommendations_user_id'), table_name='recommendations')
    op.drop_index(op.f('ix_recommendations_id'), table_name='recommendations')
    op.drop_table('recommendations')

    op.drop_index(op.f('ix_weak_topics_user_id'), table_name='weak_topics')
    op.drop_index(op.f('ix_weak_topics_id'), table_name='weak_topics')
    op.drop_table('weak_topics')

    op.drop_index(op.f('ix_learning_analytics_user_id'), table_name='learning_analytics')
    op.drop_index(op.f('ix_learning_analytics_id'), table_name='learning_analytics')
    op.drop_table('learning_analytics')
