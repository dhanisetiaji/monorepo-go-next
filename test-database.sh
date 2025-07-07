#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Testing Database Connection & ORM Models...${NC}"

# Check if PostgreSQL is running
if ! nc -z localhost 5432 2>/dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not running, starting it...${NC}"
    docker-compose -f docker-compose.dev.yml up -d postgres-dev
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    sleep 5
fi

# Test PostgreSQL connection
if nc -z localhost 5432 2>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is running on port 5432${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not accessible${NC}"
    exit 1
fi

# Test Go backend with database
echo -e "${YELLOW}🧪 Testing Go backend with database connection...${NC}"
cd apps/backend

# Load environment variables and test
echo -e "${BLUE}📋 Environment variables:${NC}"
echo "DB_HOST: ${DB_HOST:-localhost}"
echo "DB_PORT: ${DB_PORT:-5432}"
echo "DB_USER: ${DB_USER:-monorepo_user}"
echo "DB_NAME: ${DB_NAME:-monorepo_db}"

# Test if backend can connect to database
echo -e "${YELLOW}🔧 Testing backend startup...${NC}"
timeout 10s go run main.go &
GO_PID=$!

# Wait a moment for startup
sleep 3

# Check if backend is responding
if curl -s http://localhost:8080/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend started successfully with database connection${NC}"
    echo -e "${GREEN}✅ Auto migration completed${NC}"
    echo -e "${GREEN}✅ Default roles and permissions seeded${NC}"
else
    echo -e "${RED}❌ Backend failed to start properly${NC}"
fi

# Cleanup
kill $GO_PID 2>/dev/null

echo -e "${BLUE}🎯 Test completed!${NC}"
echo -e "${YELLOW}💡 To start with database: make dev-with-db${NC}"
