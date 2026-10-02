"""add deactivated_at and archived_at to users

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-02

NOTE: hand-written, not produced by `alembic revision --autogenerate`, because
this was built in a sandbox with no network access to install alembic/sqlalchemy
or run against Postgres. Run `alembic upgrade head` locally against a real DB
and eyeball the resulting schema against models.py before trusting this.

deactivated_at is stamped by the admin deactivate endpoint going forward.
Users who were deactivated before this migration will have deactivated_at
= NULL, so they are not retroactively eligible for archival - there's no
reliable way to know when they were actually deactivated.
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("deactivated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "archived_at")
    op.drop_column("users", "deactivated_at")
