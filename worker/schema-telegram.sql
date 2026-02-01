-- Telegram Integration Schema
-- Run this migration AFTER the main schema

-- Daily Expenses Table (Telegram bot expenses)
CREATE TABLE IF NOT EXISTS daily_expenses (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  month_key TEXT NOT NULL,        -- "2026-February"
  date TEXT NOT NULL,             -- "2026-02-01"
  description TEXT NOT NULL,      -- "beli beras", "ngecas motor"
  amount INTEGER NOT NULL,        -- Amount in Rupiah (30000)
  category TEXT DEFAULT 'Others',
  source TEXT DEFAULT 'telegram', -- 'telegram' or 'web'
  telegram_message_id INTEGER,    -- Original Telegram message ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Telegram Link Codes (Magic codes for account linking)
CREATE TABLE IF NOT EXISTS telegram_link_codes (
  code TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add telegram_user_id to users table
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS
-- Run manually or use migration system to check if column exists

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_expenses_user_month ON daily_expenses(user_id, month_key);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_date ON daily_expenses(date);
CREATE INDEX IF NOT EXISTS idx_telegram_codes_expires ON telegram_link_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_user_id);
