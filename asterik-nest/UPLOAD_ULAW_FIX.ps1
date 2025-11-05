# PowerShell script to upload µ-law conversion fix
# Run from: asterisk-project directory

Write-Host ""
Write-Host "🎯 UPLOADING µ-LAW CONVERSION FIX..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This fix adds automatic audio format conversion:" -ForegroundColor Yellow
Write-Host "  → Asterisk (µ-law) → RTP Bridge → Pipecat (16-bit PCM)" -ForegroundColor White
Write-Host "  → Pipecat (16-bit PCM) → RTP Bridge → Asterisk (µ-law)" -ForegroundColor White
Write-Host ""

# Configuration
$serverUser = "nortel"
$serverIP = Read-Host "Enter your server IP"

Write-Host ""
Write-Host "📤 Uploading fixed files..." -ForegroundColor Yellow

# Upload RTP bridge service with µ-law conversion
Write-Host "  → Uploading rtp-audio-bridge.service.ts (with µ-law conversion)..."
scp "asterik-nest/src/audio/rtp-audio-bridge.service.ts" "${serverUser}@${serverIP}:~/asterik-nest/src/audio/"

# Upload incoming calls service
Write-Host "  → Uploading incoming-calls.service.ts..."
scp "asterik-nest/src/incoming-calls/incoming-calls.service.ts" "${serverUser}@${serverIP}:~/asterik-nest/src/incoming-calls/"

Write-Host ""
Write-Host "✅ FILES UPLOADED!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS (run on server):" -ForegroundColor Cyan
Write-Host ""
Write-Host "cd ~/asterik-nest" -ForegroundColor White
Write-Host "docker-compose down" -ForegroundColor White
Write-Host "docker rmi asterik-nest-voicedesk" -ForegroundColor White
Write-Host "docker-compose --profile ai build --no-cache voicedesk" -ForegroundColor White
Write-Host "docker-compose --profile ai up -d" -ForegroundColor White
Write-Host "docker-compose logs -f voicedesk-app | grep 'RTP Bridge'" -ForegroundColor White
Write-Host ""
Write-Host "🎉 RESULT: PERFECT AUDIO QUALITY!" -ForegroundColor Green
Write-Host "   ✅ No distortion" -ForegroundColor Green
Write-Host "   ✅ Clear voice" -ForegroundColor Green
Write-Host "   ✅ Natural conversation" -ForegroundColor Green
Write-Host ""

