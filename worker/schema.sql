DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS income_sources;
DROP TABLE IF EXISTS savings;
DROP TABLE IF EXISTS budget_items;
DROP TABLE IF EXISTS global_settings;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE global_settings (
  user_id INTEGER PRIMARY KEY,
  settings_json TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE income_sources (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  month_key TEXT NOT NULL, -- e.g., "2024-01"
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE savings (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  month_key TEXT NOT NULL,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE budget_items (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  month_key TEXT NOT NULL,
  name TEXT NOT NULL,
  allocation INTEGER NOT NULL,
  realization INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_income_user_month ON income_sources(user_id, month_key);
CREATE INDEX idx_savings_user_month ON savings(user_id, month_key);
CREATE INDEX idx_budget_user_month ON budget_items(user_id, month_key);
