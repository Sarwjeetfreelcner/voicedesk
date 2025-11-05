# Deploy All Fixes - Uploads and Rebuilds Everything
# Run this from the asterisk-project directory on Windows

$SERVER = "nortel@YOUR_SERVER_IP"  # UPDATE THIS!

Write-Host "🚀 DEPLOYING ALL FIXES..." -ForegroundColor Cyan
Write-Host ""

# Upload VoiceDesk files
Write-Host "📤 Uploading VoiceDesk files..." -ForegroundColor Yellow
scp "asterik-nest/src/incoming-calls/incoming-calls.service.ts" "${SERVER}:~/asterik-nest/src/incoming-calls/"
scp "asterik-nest/src/audio/rtp-audio-bridge.service.ts" "${SERVER}:~/asterik-nest/src/audio/"

# Upload Pipecat file
Write-Host "📤 Uploading Pipecat file..." -ForegroundColor Yellow
scp "pipecat-agent/bot_asterisk.py" "${SERVER}:~/pipecat-agent/"

Write-Host ""
Write-Host "✅ All files uploaded!" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Next: Rebuild containers on server" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run these commands:" -ForegroundColor Yellow
Write-Host "  ssh $SERVER" -ForegroundColor White
Write-Host "  cd ~/asterik-nest" -ForegroundColor White
Write-Host "  docker-compose --profile ai down" -ForegroundColor White
Write-Host "  docker-compose --profile ai build --no-cache voicedesk pipecat-agent" -ForegroundColor White
Write-Host "  docker-compose --profile ai up -d" -ForegroundColor White
Write-Host "  docker-compose logs -f voicedesk pipecat-agent" -ForegroundColor White
Write-Host ""
Write-Host "📞 Then make a test call!" -ForegroundColor Green
Write-Host ""

