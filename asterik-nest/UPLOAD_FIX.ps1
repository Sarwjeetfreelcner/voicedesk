#!/usr/bin/env pwsh
# Upload the TX=0 fix to server

Write-Host "🚀 Uploading Pipecat audio fix..." -ForegroundColor Cyan
Write-Host ""

# Get server IP
$serverIP = Read-Host "Enter your server IP"
$serverUser = "nortel"

Write-Host ""
Write-Host "📤 Uploading bot_asterisk.py..." -ForegroundColor Yellow

# Upload the fixed file
scp ..\pipecat-agent\bot_asterisk.py "${serverUser}@${serverIP}:~/pipecat-agent/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ File uploaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Now run these commands on your server:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  ssh ${serverUser}@${serverIP}" -ForegroundColor White
    Write-Host "  cd ~/asterik-nest" -ForegroundColor White
    Write-Host "  docker-compose --profile ai down" -ForegroundColor White
    Write-Host "  docker-compose --profile ai build --no-cache pipecat-agent" -ForegroundColor White
    Write-Host "  docker-compose --profile ai up -d" -ForegroundColor White
    Write-Host "  docker-compose logs -f pipecat-agent voicedesk" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Look for these logs after rebuild:" -ForegroundColor Yellow
    Write-Host "  ✅ TTS configured for 8kHz output" -ForegroundColor Green
    Write-Host "  🔊 [Pipecat→Asterisk] First audio frame" -ForegroundColor Green
    Write-Host "  TX > 0 packets (not TX=0!)" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Upload failed! Check your connection." -ForegroundColor Red
    exit 1
}

