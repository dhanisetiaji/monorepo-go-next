#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Testing API Connection...${NC}"

# Check if backend is running
if curl -s http://localhost:8080/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:8080${NC}"
    
    # Test API endpoints
    echo -e "${YELLOW}🧪 Testing API endpoints...${NC}"
    
    # Test hello endpoint
    if curl -s http://localhost:8080/api/v1/hello | grep -q "Hello from Go backend"; then
        echo -e "${GREEN}✅ Hello endpoint working${NC}"
    else
        echo -e "${RED}❌ Hello endpoint failed${NC}"
    fi
    
    # Test users endpoint
    if curl -s http://localhost:8080/api/v1/users | grep -q "John Doe"; then
        echo -e "${GREEN}✅ Users endpoint working${NC}"
    else
        echo -e "${RED}❌ Users endpoint failed${NC}"
    fi
    
else
    echo -e "${RED}❌ Backend is not running on http://localhost:8080${NC}"
    echo -e "${YELLOW}💡 Start it with: cd apps/backend && go run main.go${NC}"
fi

# Check if frontend is accessible
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend is not running on http://localhost:3000${NC}"
    echo -e "${YELLOW}💡 Start it with: cd apps/web && npm run dev${NC}"
fi

echo -e "${YELLOW}🌐 Open http://localhost:3000 in your browser to see the app${NC}"
