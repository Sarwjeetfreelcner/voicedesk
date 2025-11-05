#!/usr/bin/env pwsh
# Upload the NumPy fix - THE FINAL MISSING PIECE!

Write-Host "🎯 Uploading FINAL FIX: NumPy Dependency" -ForegroundColor Green
Write-Host ""
Write-Host "ISSUE: NumPy was missing from requirements.txt!" -ForegroundColor Yellow
Write-Host "FIX: Added numpy to requirements.txt" -ForegroundColor Cyan
Write-Host ""

# Get server IP
$serverIP = Read-Host "Enter your server IP"
$serverUser = "nortel"

Write-Host ""
Write-Host "📤 Uploading 3 files..." -ForegroundColor Yellow
Write-Host ""

# Upload requirements.txt (CRITICAL!)
Write-Host "1/3: Uploading requirements.txt (with numpy)..." -ForegroundColor White
scp ..\pipecat-agent\requirements.txt "${serverUser}@${serverIP}:~/pipecat-agent/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed for requirements.txt!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ requirements.txt uploaded" -ForegroundColor Green

# Upload bot_asterisk.py
Write-Host "2/3: Uploading bot_asterisk.py..." -ForegroundColor White
scp ..\pipecat-agent\bot_asterisk.py "${serverUser}@${serverIP}:~/pipecat-agent/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed for bot_asterisk.py!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ bot_asterisk.py uploaded" -ForegroundColor Green

# Upload app.py
Write-Host "3/3: Uploading app.py..." -ForegroundColor White
scp ..\pipecat-agent\app.py "${serverUser}@${serverIP}:~/pipecat-agent/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed for app.py!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ app.py uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "✅ All files uploaded successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Now run these commands on your server:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ssh ${serverUser}@${serverIP}" -ForegroundColor White
Write-Host "  cd ~/asterik-nest" -ForegroundColor White
Write-Host "  docker-compose --profile ai down" -ForegroundColor White
Write-Host "  docker-compose --profile ai build --no-cache pipecat-agent" -ForegroundColor Yellow
Write-Host "  docker-compose --profile ai up -d" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Use --no-cache to reinstall numpy!" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 After rebuild, you should see:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Created Asterisk serializer" -ForegroundColor Green
Write-Host "  ✅ TTS configured for 8kHz output" -ForegroundColor Green
Write-Host "  ✅ Pipeline created" -ForegroundColor Green
Write-Host "  🚀 Starting pipeline runner..." -ForegroundColor Green
Write-Host "  🎤 Asterisk client connected" -ForegroundColor Green
Write-Host "  💬 Preparing greeting message..." -ForegroundColor Green
Write-Host "  📤 Sending greeting to TTS pipeline..." -ForegroundColor Green
Write-Host "  ✅ Greeting queued successfully" -ForegroundColor Green
Write-Host "  🔊 [Pipecat→Asterisk] First audio frame" -ForegroundColor Green
Write-Host ""
Write-Host "📞 Then make a test call - YOU WILL HEAR THE GREETING! 🎉" -ForegroundColor Cyan
Write-Host ""

