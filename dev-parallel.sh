#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Both Development Servers${NC}"

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping development servers...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Go backend in background
echo -e "${BLUE}🔧 Starting Go Backend on http://localhost:8080${NC}"
cd apps/backend && go run main.go &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 2

# Start Next.js frontend in background
echo -e "${BLUE}🔧 Starting Next.js Frontend on http://localhost:3000${NC}"
cd apps/web && npm run dev &
FRONTEND_PID=$!
cd ../..

echo -e "${GREEN}✅ Both servers are starting...${NC}"
echo -e "${YELLOW}📋 Services:${NC}"
echo -e "${YELLOW}   - Backend: http://localhost:8080${NC}"
echo -e "${YELLOW}   - Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}   - API Health: http://localhost:8080/health${NC}"
echo -e "${YELLOW}🔄 Press Ctrl+C to stop all servers${NC}"

# Wait for background processes
wait
