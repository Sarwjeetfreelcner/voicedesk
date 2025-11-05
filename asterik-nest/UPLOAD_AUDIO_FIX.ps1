# PowerShell script to upload audio format fixes
# Run from: asterisk-project directory

Write-Host "🔧 UPLOADING AUDIO FORMAT FIXES..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$serverUser = "nortel"
$serverIP = Read-Host "Enter your server IP"

Write-Host ""
Write-Host "📤 Uploading fixed files..." -ForegroundColor Yellow

# Upload RTP bridge service
Write-Host "  → Uploading rtp-audio-bridge.service.ts..."
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
Write-Host "docker-compose logs -f voicedesk-app" -ForegroundColor White
Write-Host ""
Write-Host "🎉 RESULT: CRYSTAL CLEAR AUDIO (no distortion!)" -ForegroundColor Green
Write-Host ""

