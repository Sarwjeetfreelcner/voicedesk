#!/bin/bash

echo "🚀 VoiceDesk AI Admin Dashboard - Automated Installation"
echo "=========================================================="
echo ""

# Colors
RED='\033[0.31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL client found${NC}"
fi

echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend installation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo ""
echo "📦 Installing Frontend Dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend installation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

echo ""
echo "🗄️  Initializing Database..."
cd ../backend
cp config.env .env
npm run init-db
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database initialization failed${NC}"
    echo -e "${YELLOW}Please check your database credentials in backend/config.env${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================================="
echo "✅ Installation Complete!"
echo "==========================================================${NC}"
echo ""
echo "📋 Default Admin Credentials:"
echo -e "   Username: ${GREEN}admin${NC}"
echo -e "   Password: ${GREEN}admin123${NC}"
echo ""
echo "⚠️  IMPORTANT: Change the default password after first login!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   $ cd admin-dashboard/backend"
echo "   $ npm start"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ cd admin-dashboard/frontend"
echo "   $ npm start"
echo ""
echo "   Then open: http://localhost:3000"
echo ""
echo -e "${GREEN}Happy managing! 🎉${NC}"

