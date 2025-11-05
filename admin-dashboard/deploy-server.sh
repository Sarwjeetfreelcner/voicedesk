#!/bin/bash

# VoiceDesk Admin Dashboard - Server Deployment Script
# For ai-agent-platform server

echo "========================================"
echo "   VoiceDesk Admin Dashboard Deploy    "
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current directory
ADMIN_DIR="$HOME/admin-dashboard"

echo "📁 Working directory: $ADMIN_DIR"
echo ""

# Step 1: Check if PM2 is installed
echo "🔍 Checking PM2..."
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 is installed${NC}"
fi
echo ""

# Step 2: Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$ADMIN_DIR/backend"
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Step 3: Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd "$ADMIN_DIR/frontend"
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Step 4: Build frontend
echo "🔨 Building frontend for production..."
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

# Step 5: Check if serve is installed
echo "🔍 Checking serve package..."
if ! command -v serve &> /dev/null; then
    echo -e "${YELLOW}⚠️  serve not found. Installing...${NC}"
    sudo npm install -g serve
    echo -e "${GREEN}✅ serve installed${NC}"
else
    echo -e "${GREEN}✅ serve is installed${NC}"
fi
echo ""

# Step 6: Start backend with PM2
echo "🚀 Starting backend with PM2..."
cd "$ADMIN_DIR/backend"
pm2 delete voicedesk-admin-api 2>/dev/null || true
pm2 start npm --name "voicedesk-admin-api" -- start
echo -e "${GREEN}✅ Backend started${NC}"
echo ""

# Step 7: Start frontend with PM2
echo "🚀 Starting frontend with PM2..."
cd "$ADMIN_DIR/frontend"
pm2 delete voicedesk-admin-ui 2>/dev/null || true
pm2 start serve --name "voicedesk-admin-ui" -- -s build -l 3000
echo -e "${GREEN}✅ Frontend started${NC}"
echo ""

# Step 8: Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save
echo -e "${GREEN}✅ PM2 configuration saved${NC}"
echo ""

# Step 9: Show status
echo "📊 Current status:"
pm2 status
echo ""

# Step 10: Show logs preview
echo "📋 Recent logs:"
pm2 logs --lines 10 --nostream
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo "========================================"
echo -e "${GREEN}   🎉 DEPLOYMENT COMPLETE!${NC}"
echo "========================================"
echo ""
echo "📍 Server IP: $SERVER_IP"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://$SERVER_IP:3000"
echo "   Backend:  http://$SERVER_IP:5000/api"
echo "   Health:   http://$SERVER_IP:5000/health"
echo ""
echo "🔑 Default Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📋 Useful Commands:"
echo "   View status:  pm2 status"
echo "   View logs:    pm2 logs"
echo "   Restart all:  pm2 restart all"
echo "   Stop all:     pm2 stop all"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Change admin password after first login!"
echo "   2. Configure firewall: sudo ufw allow 3000/tcp"
echo "                          sudo ufw allow 5000/tcp"
echo ""
echo "🎯 Next step: Make a test call to +441135117691"
echo "   Then check Transcripts page in dashboard!"
echo ""

