"""Idempotent additive migration for existing PostgreSQL databases. Backup first."""
from sqlalchemy import text
from app.db import engine
with engine.begin() as conn:
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE'))
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0'))
print('Auth schema upgraded. Existing users and data preserved.')
