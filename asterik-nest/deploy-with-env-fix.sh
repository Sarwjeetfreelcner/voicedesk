#!/bin/bash
# Deploy Pipecat with proper environment variable handling

echo "🔧 Cleaning up environment variables..."

# Unset any override variables
unset GREETING_MESSAGE
unset SYSTEM_PROMPT

echo "✅ Environment cleaned"
echo ""

cd ~/asterik-nest

echo "📋 Stopping containers..."
docker-compose --profile ai down

echo "🗑️ Removing old image..."
docker rmi asterik-nest-pipecat-agent 2>/dev/null || true

echo "📦 Building with clean environment..."
GREETING_MESSAGE="" SYSTEM_PROMPT="" docker-compose --profile ai build --no-cache pipecat-agent

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

echo "🎬 Starting containers with default env..."
GREETING_MESSAGE="" SYSTEM_PROMPT="" docker-compose --profile ai up -d

echo "✅ Deployed!"
echo ""
echo "📋 Showing logs - watch for:"
echo "  ✅ Greeting: 'Hello! How can I help you?'"
echo "  ✅ Deepgram transcriptions"
echo "  ✅ User messages in transcript"
echo ""
docker-compose logs -f pipecat-agent

