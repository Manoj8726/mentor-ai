"""add rag fields to document

Revision ID: 3a4b5c6d7e8f
Revises: 2a3b4c5d6e7f
Create Date: 2026-07-04 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '3a4b5c6d7e8f'
down_revision: Union[str, None] = '2a3b4c5d6e7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to documents table
    op.add_column('documents', sa.Column('index_status', sa.String(length=50), nullable=False, server_default='uploaded'))
    op.add_column('documents', sa.Column('index_started_at', sa.DateTime(), nullable=True))
    op.add_column('documents', sa.Column('index_completed_at', sa.DateTime(), nullable=True))
    op.add_column('documents', sa.Column('index_error', sa.String(length=1000), nullable=True))
    op.add_column('documents', sa.Column('total_chunks', sa.Integer(), nullable=True))
    op.add_column('documents', sa.Column('embedding_model', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove columns from documents table
    op.drop_column('documents', 'embedding_model')
    op.drop_column('documents', 'total_chunks')
    op.drop_column('documents', 'index_error')
    op.drop_column('documents', 'index_completed_at')
    op.drop_column('documents', 'index_started_at')
    op.drop_column('documents', 'index_status')
