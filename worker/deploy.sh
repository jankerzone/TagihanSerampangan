#!/bin/bash
set -e

echo "🚀 Deploying Worker API..."

# Deploy worker
npx wrangler deploy

echo "✅ Worker deployed!"
echo "🔗 API: https://tagihan-api.jankerzone.workers.dev"
