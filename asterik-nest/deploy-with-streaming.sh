#!/bin/bash

# Full External Media Audio Streaming Deployment Script
# This deploys the complete real-time bidirectional audio streaming solution

echo "========================================="
echo " Deploying AI Voice System with External Media Streaming"
echo "========================================="

# Step 1: Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Step 2: Rebuild with latest code
echo "🔨 Rebuilding containers with streaming support..."
docker-compose --profile ai build --no-cache

# Step 3: Start all services
echo "🚀 Starting all services (Asterisk + VoiceDesk + Pipecat Agent)..."
docker-compose --profile ai up -d

# Step 4: Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 10

# Step 5: Check service status
echo "📊 Service Status:"
docker-compose ps

# Step 6: Check logs
echo ""
echo "📜 Recent VoiceDesk Logs:"
docker-compose logs --tail=20 voicedesk

echo ""
echo "📜 Recent Pipecat Agent Logs:"
docker-compose logs --tail=20 pipecat-agent

echo ""
echo "========================================="
echo " ✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Your AI voice system is now running with:"
echo "  ✓ Real-time audio streaming (Snoop + Bridge)"
echo "  ✓ Bidirectional audio (caller ↔ AI)"
echo "  ✓ OpenAI GPT-4 for conversations"
echo "  ✓ Deepgram for Speech-to-Text"
echo "  ✓ ElevenLabs for Text-to-Speech"
echo ""
echo "📞 Make a test call to verify:"
echo "   Dial: +441135117691"
echo ""
echo "📊 Monitor logs:"
echo "   docker-compose logs -f voicedesk"
echo "   docker-compose logs -f pipecat-agent"
echo ""
echo "🛑 To stop:"
echo "   docker-compose --profile ai down"
echo "========================================="

