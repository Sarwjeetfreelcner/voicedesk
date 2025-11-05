#!/bin/bash
# Simplified deployment script for Pipecat Agent

echo "🚀 Deploying Pipecat Agent with VAD Fix..."
echo ""

cd ~/asterik-nest

echo "📋 Step 1/4: Stopping containers..."
docker-compose --profile ai down

echo "✅ Containers stopped"
echo ""

echo "🗑️ Step 2/4: Removing old image..."
docker rmi asterik-nest-pipecat-agent 2>/dev/null || echo "Image already removed or doesn't exist"

echo "✅ Old image removed"
echo ""

echo "📦 Step 3/4: Building new image (no cache)..."
docker-compose --profile ai build --no-cache pipecat-agent

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

echo "✅ Build successful!"
echo ""

echo "🎬 Step 4/4: Starting containers..."
docker-compose --profile ai up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start containers!"
    exit 1
fi

echo "✅ Containers started!"
echo ""

echo "📋 Showing logs (Ctrl+C to exit):"
echo ""
docker-compose logs -f pipecat-agent

