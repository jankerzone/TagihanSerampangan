#!/bin/bash
# Initialize local D1 database for development

echo "🗄️  Initializing local D1 database..."

# Apply main schema
echo "📝 Applying main schema..."
npx wrangler d1 execute tagihan-db --local --file=./schema.sql

# Add telegram_user_id column to users table
echo "📝 Adding telegram column to users table..."
npx wrangler d1 execute tagihan-db --local --file=./schema-add-telegram-column.sql

# Apply savings goals schema
echo "📝 Applying savings goals schema..."
npx wrangler d1 execute tagihan-db --local --file=./schema-savings-goals.sql

# Apply telegram schema
echo "📝 Applying telegram schema..."
npx wrangler d1 execute tagihan-db --local --file=./schema-telegram.sql

# Apply linked devices schema
echo "📝 Applying linked devices schema..."
npx wrangler d1 execute tagihan-db --local --file=./schema-linked-devices.sql

echo "✅ Local database initialized successfully!"
echo "🚀 You can now run: npm run dev"
