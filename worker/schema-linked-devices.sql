-- Create linked_devices table
CREATE TABLE IF NOT EXISTS linked_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  telegram_user_id TEXT NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(telegram_user_id)
);

-- Migrate existing users (if any)
INSERT INTO linked_devices (user_id, telegram_user_id)
SELECT id, telegram_user_id 
FROM users 
WHERE telegram_user_id IS NOT NULL;

-- (Optional) We don't delete the column from users because SQLite doesn't support DROP COLUMN easily 
-- and it's safer to keep it for now as legacy.
