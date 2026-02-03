-- Clerk user mapping table
-- Maps Clerk user IDs to internal user IDs for seamless migration
CREATE TABLE IF NOT EXISTS clerk_user_mapping (
  clerk_user_id TEXT PRIMARY KEY,
  internal_user_id INTEGER NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (internal_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clerk_mapping_internal ON clerk_user_mapping(internal_user_id);
CREATE INDEX IF NOT EXISTS idx_clerk_mapping_email ON clerk_user_mapping(email);
