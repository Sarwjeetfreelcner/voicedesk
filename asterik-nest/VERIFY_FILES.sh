#!/bin/bash

echo "=========================================="
echo "🔍 VERIFYING PIPECAT FILES ON SERVER"
echo "=========================================="
echo ""

echo "📁 Checking ~/pipecat-agent/bot_asterisk.py..."
echo ""

# Check if the debug logs are in the file
echo "1️⃣ Checking for debug log strings in bot_asterisk.py:"
cd ~/pipecat-agent
grep -c "✅ Created Asterisk serializer\|🚀 Starting pipeline runner\|💬 Preparing greeting message" bot_asterisk.py

echo ""
echo "2️⃣ Checking if numpy is imported:"
grep -n "import numpy" bot_asterisk.py | head -5

echo ""
echo "3️⃣ Checking if sample_rate=8000 is set for ElevenLabs:"
grep -n "sample_rate=8000" bot_asterisk.py | head -5

echo ""
echo "4️⃣ Checking if type() method exists in AsteriskFrameSerializer:"
grep -A 3 "def type(self)" bot_asterisk.py

echo ""
echo "5️⃣ Checking requirements.txt for numpy:"
grep "numpy" requirements.txt

echo ""
echo "=========================================="
echo "📊 File Timestamps:"
echo "=========================================="
ls -lh bot_asterisk.py
ls -lh requirements.txt

echo ""
echo "=========================================="
echo "🔍 Last 10 lines of bot_asterisk.py:"
echo "=========================================="
tail -10 bot_asterisk.py

echo ""
echo "✅ Verification complete!"
