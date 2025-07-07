#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Monorepo Development Environment${NC}"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed. Please install Go first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd apps/web && npm install && cd ../..

echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd apps/backend && go mod download && cd ../..

echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"

# Start development servers
echo -e "${YELLOW}🔧 Starting development servers...${NC}"
echo -e "${YELLOW}📋 This will start:${NC}"
echo -e "${YELLOW}   - Go Backend on http://localhost:8080${NC}"
echo -e "${YELLOW}   - Next.js Frontend on http://localhost:3000${NC}"
echo -e "${YELLOW}🔄 Press Ctrl+C to stop all servers${NC}"
echo ""

# Try turbo first, fallback to parallel script if needed
echo -e "${YELLOW}🚀 Using Turborepo to start both applications...${NC}"
if ! npm run dev; then
    echo -e "${RED}❌ Turborepo failed, trying parallel approach...${NC}"
    ./dev-parallel.sh
fi
