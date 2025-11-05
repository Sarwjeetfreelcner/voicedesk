#!/bin/bash

# ============================================
# VoiceDesk + AI Integration Test Script
# ============================================

echo "🧪 Testing VoiceDesk + AI Integration"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if services are running
echo "Test 1: Checking services..."
if docker-compose ps | grep -q "voicedesk-asterisk.*Up"; then
    echo -e "${GREEN}✓ Asterisk is running${NC}"
else
    echo -e "${RED}✗ Asterisk is not running${NC}"
    exit 1
fi

if docker-compose ps | grep -q "voicedesk-app.*Up"; then
    echo -e "${GREEN}✓ VoiceDesk is running${NC}"
else
    echo -e "${RED}✗ VoiceDesk is not running${NC}"
    exit 1
fi

# Check if AI is enabled
if [ -f .env ] && grep -q "ENABLE_AI_CONVERSATION=true" .env; then
    echo -e "${YELLOW}ℹ AI Mode is ENABLED${NC}"
    
    if docker-compose ps | grep -q "pipecat-agent.*Up"; then
        echo -e "${GREEN}✓ Pipecat Agent is running${NC}"
        AI_ENABLED=true
    else
        echo -e "${RED}✗ Pipecat Agent is not running${NC}"
        echo "  Run: docker-compose --profile ai up -d"
        AI_ENABLED=false
    fi
else
    echo -e "${YELLOW}ℹ AI Mode is DISABLED${NC}"
    AI_ENABLED=false
fi

echo ""

# Test 2: Check API connectivity
echo "Test 2: Checking API connectivity..."

# Check VoiceDesk API
if curl -s http://localhost:3000/api > /dev/null 2>&1; then
    echo -e "${GREEN}✓ VoiceDesk API is accessible${NC}"
else
    echo -e "${RED}✗ VoiceDesk API is not accessible${NC}"
fi

# Check Asterisk ARI
if curl -s http://localhost:8088/ari/api-docs > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Asterisk ARI is accessible${NC}"
else
    echo -e "${RED}✗ Asterisk ARI is not accessible${NC}"
fi

# Check Pipecat if AI is enabled
if [ "$AI_ENABLED" == "true" ]; then
    if curl -s http://localhost:8080/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Pipecat Agent is accessible${NC}"
    else
        echo -e "${RED}✗ Pipecat Agent is not accessible${NC}"
    fi
fi

echo ""

# Test 3: Check logs for errors
echo "Test 3: Checking recent logs for errors..."

ERROR_COUNT=$(docker-compose logs --tail=100 | grep -i "error" | wc -l)

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ No errors in recent logs${NC}"
else
    echo -e "${YELLOW}⚠ Found $ERROR_COUNT error messages in logs${NC}"
    echo "  View logs: docker-compose logs -f"
fi

echo ""

# Test 4: Check environment variables
echo "Test 4: Checking environment configuration..."

if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    if [ "$AI_ENABLED" == "true" ]; then
        # Check API keys are set
        if grep -q "OPENAI_API_KEY=" .env && ! grep -q "your_.*_api_key_here" .env; then
            echo -e "${GREEN}✓ API keys appear to be configured${NC}"
        else
            echo -e "${RED}✗ API keys are not configured${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠ .env file not found (using defaults)${NC}"
fi

echo ""
echo "================================"
echo "📊 Test Summary:"
echo "================================"

if [ "$AI_ENABLED" == "true" ]; then
    echo -e "${GREEN}Mode: AI Conversation ENABLED${NC}"
    echo ""
    echo "When you call 01135117691:"
    echo "  1. Asterisk will answer"
    echo "  2. VoiceDesk connects to Pipecat Agent"
    echo "  3. AI assistant has real-time conversation"
    echo "  4. If AI fails, static audio plays as fallback"
else
    echo -e "${YELLOW}Mode: Standard (AI DISABLED)${NC}"
    echo ""
    echo "When you call 01135117691:"
    echo "  1. Asterisk will answer"
    echo "  2. Static audio plays"
    echo "  3. Call ends"
    echo ""
    echo "To enable AI:"
    echo "  1. Create .env from env.ai.example"
    echo "  2. Add your API keys"
    echo "  3. Run: docker-compose --profile ai up -d"
fi

echo ""
echo "📞 Make a test call to: 01135117691"
echo "📋 Monitor logs: docker-compose logs -f voicedesk"
echo ""
