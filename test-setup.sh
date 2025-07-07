#!/bin/bash

echo "🧪 Testing Monorepo Setup..."

# Test Go backend
echo "🔍 Testing Go backend..."
cd apps/backend
if go build -o bin/test main.go; then
    echo "✅ Go backend builds successfully"
    rm -f bin/test
else
    echo "❌ Go backend build failed"
    exit 1
fi
cd ../..

# Test Next.js frontend
echo "🔍 Testing Next.js frontend..."
cd apps/web
if npm run build > /dev/null 2>&1; then
    echo "✅ Next.js frontend builds successfully"
    rm -rf .next
else
    echo "❌ Next.js frontend build failed"
    exit 1
fi
cd ../..

echo "🎉 All tests passed! Your monorepo is ready for development."
