#!/bin/bash

echo "🚀 Deploying Dynamic Prompts & Greetings Integration"
echo "===================================================="

cd ~/asterik-nest

echo ""
echo "📦 Step 1: Rebuilding Pipecat agent container..."
docker-compose build pipecat-agent

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

echo ""
echo "✅ Build successful!"

echo ""
echo "🔄 Step 2: Restarting Pipecat agent..."
docker-compose --profile ai up -d pipecat-agent

if [ $? -ne 0 ]; then
    echo "❌ Restart failed! Check errors above."
    exit 1
fi

echo ""
echo "✅ Pipecat agent restarted!"

echo ""
echo "📊 Step 3: Checking container status..."
docker ps | grep pipecat-agent

echo ""
echo "📝 Step 4: Checking recent logs..."
echo "--------------------------------------"
docker logs pipecat-agent --tail 30

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "✅ The Pipecat agent will now:"
echo "   - Fetch active system prompts from the database"
echo "   - Fetch active greeting messages from the database"
echo "   - Apply changes immediately on the next call"
echo ""
echo "🧪 To test:"
echo "   1. Update a prompt or greeting in the admin dashboard"
echo "   2. Make a test call"
echo "   3. Check logs: docker logs -f pipecat-agent | grep 'ADMIN DASHBOARD'"
echo ""
echo "📋 Expected log output:"
echo "   ✅ [ADMIN DASHBOARD] Fetching active system prompt..."
echo "   ✅ [ADMIN DASHBOARD] Using active prompt from database"
echo "   ✅ [ADMIN DASHBOARD] Fetching active greeting..."
echo "   ✅ [ADMIN DASHBOARD] Using active greeting from database"
echo ""

