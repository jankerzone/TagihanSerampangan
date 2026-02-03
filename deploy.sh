#!/bin/bash
set -e

echo "🚀 Deploying TagihanSerampangan to Production..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Deploy to Cloudflare Pages
echo "🌍 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name tagihan-frontend

echo "✅ Deployment complete!"
echo "🔗 Production: https://tagihan.jankerzone.com"
