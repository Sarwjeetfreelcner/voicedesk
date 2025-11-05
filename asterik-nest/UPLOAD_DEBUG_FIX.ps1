#!/usr/bin/env pwsh
# Upload debug version to find why Pipecat is crashing

Write-Host "🐛 Uploading DEBUG version to find silent crash..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This version adds extensive logging to catch errors!" -ForegroundColor Cyan
Write-Host ""

# Get server IP
$serverIP = Read-Host "Enter your server IP"
$serverUser = "nortel"

Write-Host ""
Write-Host "📤 Uploading bot_asterisk.py with debug logging..." -ForegroundColor Yellow
scp ..\pipecat-agent\bot_asterisk.py "${serverUser}@${serverIP}:~/pipecat-agent/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed for bot_asterisk.py!" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Uploading app.py with debug logging..." -ForegroundColor Yellow
scp ..\pipecat-agent\app.py "${serverUser}@${serverIP}:~/pipecat-agent/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed for app.py!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Now run these commands on your server:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ssh ${serverUser}@${serverIP}" -ForegroundColor White
Write-Host "  cd ~/asterik-nest" -ForegroundColor White
Write-Host "  docker-compose --profile ai down" -ForegroundColor White
Write-Host "  docker-compose --profile ai build --no-cache pipecat-agent" -ForegroundColor White
Write-Host "  docker-compose --profile ai up -d" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Then watch logs for errors:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f pipecat-agent | grep -E 'info|error|✅|❌|💬|📤'" -ForegroundColor White
Write-Host ""
Write-Host "🎯 What to look for:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ GOOD: '💬 Preparing greeting message'" -ForegroundColor Green
Write-Host "  ✅ GOOD: '📤 Sending greeting to TTS pipeline'" -ForegroundColor Green
Write-Host "  ✅ GOOD: '🔊 [Pipecat→Asterisk] First audio frame'" -ForegroundColor Green
Write-Host ""
Write-Host "  ❌ BAD: '❌ Error in on_client_connected'" -ForegroundColor Red
Write-Host "  ❌ BAD: '❌ Failed to run Asterisk bot'" -ForegroundColor Red
Write-Host ""
Write-Host "📝 If you see errors, send me the full logs!" -ForegroundColor Yellow
Write-Host ""

