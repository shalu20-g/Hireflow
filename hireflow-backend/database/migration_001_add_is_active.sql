-- HireFlow migration 001: add users.is_active
-- Safe, non-destructive, idempotent. No DROP/TRUNCATE/DELETE.
-- Existing rows receive is_active = TRUE via the column default.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
-- Belt-and-braces: guarantee pre-existing rows are active even on
-- engines that do not backfill the DEFAULT on ADD COLUMN.
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
