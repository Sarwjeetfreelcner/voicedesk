#!/usr/bin/env pwsh
# Upload the serializer fix to server

Write-Host "🚨 Uploading CRITICAL SERIALIZER FIX..." -ForegroundColor Red
Write-Host ""
Write-Host "This fixes the error: 'Can't instantiate abstract class AsteriskFrameSerializer'" -ForegroundColor Yellow
Write-Host ""

# Get server IP
$serverIP = Read-Host "Enter your server IP"
$serverUser = "nortel"

Write-Host ""
Write-Host "📤 Uploading bot_asterisk.py with type() method fix..." -ForegroundColor Yellow

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
    Write-Host "  docker-compose logs -f pipecat-agent" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 After rebuild, look for:" -ForegroundColor Yellow
    Write-Host "  ✅ [Asterisk Serializer] Initialized" -ForegroundColor Green
    Write-Host "  ✅ Created Asterisk serializer for call" -ForegroundColor Green
    Write-Host "  ✅ TTS configured for 8kHz output" -ForegroundColor Green
    Write-Host "  ✅ Pipeline created" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ❌ Should NOT see: 'Can't instantiate abstract class'" -ForegroundColor Red
    Write-Host ""
    Write-Host "📞 Then make a test call - you should hear the greeting!" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "❌ Upload failed! Check your connection." -ForegroundColor Red
    exit 1
}

