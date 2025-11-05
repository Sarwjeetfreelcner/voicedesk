#!/bin/bash

# ============================================
# VoiceDesk + AI Conversation Deployment
# ============================================

set -e  # Exit on error

echo "🚀 VoiceDesk + AI Conversation Deployment"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    echo ""
    echo "Choose deployment mode:"
    echo "1) Without AI (use existing static audio)"
    echo "2) With AI (enable real-time AI conversation)"
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" == "2" ]; then
        echo ""
        echo "📝 Creating .env file for AI mode..."
        cp env.ai.example .env
        echo ""
        echo "⚠️  IMPORTANT: Edit .env file and add your API keys!"
        echo ""
        echo "Required:"
        echo "  - OPENAI_API_KEY"
        echo "  - DEEPGRAM_API_KEY"
        echo "  - ELEVENLABS_API_KEY"
        echo ""
        read -p "Press Enter after you've added your API keys to .env..."
        
        # Verify API keys are set
        if grep -q "your_.*_api_key_here" .env; then
            echo "❌ Please update .env with actual API keys!"
            exit 1
        fi
        
        echo "✅ .env file configured"
        AI_MODE=true
    else
        echo "✅ Running without AI (using existing code)"
        AI_MODE=false
    fi
else
    # Check if AI is enabled in existing .env
    if grep -q "ENABLE_AI_CONVERSATION=true" .env; then
        echo "✅ .env file found - AI mode ENABLED"
        AI_MODE=true
    else
        echo "✅ .env file found - AI mode DISABLED"
        AI_MODE=false
    fi
fi

echo ""
echo "📦 Building and starting services..."
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start
if [ "$AI_MODE" == "true" ]; then
    echo "🤖 Starting WITH AI conversation..."
    docker-compose --profile ai up --build -d
else
    echo "📞 Starting WITHOUT AI (existing code)..."
    docker-compose up --build -d
fi

# Wait for services to start
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 20

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Deployment Complete!"
echo ""

if [ "$AI_MODE" == "true" ]; then
    echo "🤖 AI Conversation Mode: ENABLED"
    echo ""
    echo "Services running:"
    echo "  ✓ Asterisk (SIP: 5060, ARI: 8088)"
    echo "  ✓ VoiceDesk API (Port 3000)"
    echo "  ✓ Pipecat AI Agent (Port 8080)"
    echo ""
    echo "📞 Test by calling: 01135117691"
    echo "   → AI assistant will answer and have a conversation"
else
    echo "📞 Standard Mode: Using existing audio"
    echo ""
    echo "Services running:"
    echo "  ✓ Asterisk (SIP: 5060, ARI: 8088)"
    echo "  ✓ VoiceDesk API (Port 3000)"
    echo ""
    echo "📞 Test by calling: 01135117691"
    echo "   → Static audio will play"
fi

echo ""
echo "📋 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🔄 To enable/disable AI:"
echo "   Edit .env and set ENABLE_AI_CONVERSATION=true/false"
echo "   Then run: docker-compose restart voicedesk"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
echo ""
