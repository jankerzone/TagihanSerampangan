-- Add telegram_user_id column to users table if it doesn't exist
-- This should be run after main schema but before telegram/linked-devices schemas

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we wrap it in error handling

-- Add the column
ALTER TABLE users ADD COLUMN telegram_user_id TEXT;
