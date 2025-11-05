#!/bin/bash

# Quick Deploy for ai-agent-platform
# Server IP: 195.34.79.69

echo "================================================"
echo "  🚀 VoiceDesk Admin - Quick Deploy"
echo "  📍 Server: ai-agent-platform (195.34.79.69)"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Install PM2 and serve if not installed
echo -e "${BLUE}📦 Installing dependencies...${NC}"
sudo npm install -g pm2 serve 2>/dev/null || echo "Already installed"

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend packages...${NC}"
cd ~/admin-dashboard/backend
npm install --silent

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend packages...${NC}"
cd ~/admin-dashboard/frontend
npm install --silent

# Build frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"
npm run build

# Stop any existing processes
echo -e "${BLUE}🛑 Stopping existing processes...${NC}"
pm2 delete voicedesk-admin-api 2>/dev/null || true
pm2 delete voicedesk-admin-ui 2>/dev/null || true

# Start backend
echo -e "${BLUE}🚀 Starting backend API...${NC}"
cd ~/admin-dashboard/backend
pm2 start npm --name "voicedesk-admin-api" -- start

# Start frontend
echo -e "${BLUE}🚀 Starting frontend UI...${NC}"
cd ~/admin-dashboard/frontend
pm2 start serve --name "voicedesk-admin-ui" -- -s build -l 3000

# Save PM2 config
pm2 save

# Wait a moment for services to start
sleep 3

echo ""
echo "================================================"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETE!${NC}"
echo "================================================"
echo ""

# Show status
pm2 status

echo ""
echo "================================================"
echo "  📋 ACCESS INFORMATION"
echo "================================================"
echo ""
echo -e "${GREEN}🌐 Frontend URL:${NC}"
echo "   http://195.34.79.69:3000"
echo ""
echo -e "${GREEN}🔌 Backend API:${NC}"
echo "   http://195.34.79.69:5000/api"
echo ""
echo -e "${GREEN}❤️  Health Check:${NC}"
echo "   http://195.34.79.69:5000/health"
echo ""
echo -e "${GREEN}🔑 Login Credentials:${NC}"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "================================================"
echo "  ⚠️  IMPORTANT NEXT STEPS"
echo "================================================"
echo ""
echo "1. Open firewall ports:"
echo "   sudo ufw allow 3000/tcp"
echo "   sudo ufw allow 5000/tcp"
echo ""
echo "2. Test the dashboard:"
echo "   curl http://195.34.79.69:5000/health"
echo "   Open: http://195.34.79.69:3000"
echo ""
echo "3. Make a test call to: +441135117691"
echo "   Then check Transcripts page!"
echo ""
echo "4. Change admin password after first login!"
echo ""
echo "================================================"
echo "  📊 USEFUL COMMANDS"
echo "================================================"
echo ""
echo "  View logs:     pm2 logs"
echo "  Check status:  pm2 status"
echo "  Restart all:   pm2 restart all"
echo "  Stop all:      pm2 stop all"
echo ""
echo -e "${GREEN}🎉 Ready to use!${NC}"
echo ""

