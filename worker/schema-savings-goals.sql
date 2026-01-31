-- New Savings Goals System Schema
-- This adds new tables without touching existing ones

-- Savings Goals (master list - not per month)
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_amount INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  color TEXT DEFAULT 'blue',
  icon TEXT DEFAULT 'piggy-bank',
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Monthly Contributions (replaces old savings table functionality)
CREATE TABLE IF NOT EXISTS savings_contributions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  savings_goal_id TEXT NOT NULL,
  month_key TEXT NOT NULL,
  amount INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (savings_goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_active ON savings_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_contributions_user_month ON savings_contributions(user_id, month_key);
CREATE INDEX IF NOT EXISTS idx_contributions_goal ON savings_contributions(savings_goal_id);
CREATE INDEX IF NOT EXISTS idx_contributions_goal_month ON savings_contributions(savings_goal_id, month_key);
