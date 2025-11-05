# 🚀 FINAL FIX: Upload Telephony-Optimized Deepgram Configuration
# This fixes BOTH issues: distorted audio + bot not hearing you

Write-Host "🎯 FINAL COMPREHENSIVE FIX" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Get server IP
$serverIP = Read-Host "Enter your server IP (e.g., 123.456.789.0)"
$serverUser = Read-Host "Enter your SSH username (default: nortel)"
if ([string]::IsNullOrWhiteSpace($serverUser)) { $serverUser = "nortel" }

Write-Host ""
Write-Host "📤 Uploading FINAL fixed files..." -ForegroundColor Yellow
Write-Host ""

# Upload bot_asterisk.py (Deepgram with telephony config)
Write-Host "1️⃣  Uploading Pipecat bot with telephony-optimized Deepgram..." -ForegroundColor Green
scp ..\pipecat-agent\bot_asterisk.py ${serverUser}@${serverIP}:~/pipecat-agent/

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ bot_asterisk.py uploaded successfully!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload bot_asterisk.py" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️  Rebuilding Docker containers..." -ForegroundColor Yellow
Write-Host ""

# SSH commands to rebuild
$rebuildCommands = @"
cd ~/asterik-nest && \
echo '🔄 Stopping services...' && \
docker-compose down && \
echo '🗑️  Removing old pipecat-agent image...' && \
docker rmi asterik-nest-pipecat-agent 2>/dev/null || true && \
echo '🏗️  Building pipecat-agent with NO cache...' && \
docker-compose --profile ai build --no-cache pipecat-agent && \
echo '🚀 Starting all services...' && \
docker-compose --profile ai up -d && \
echo '' && \
echo '✅ Deployment complete!' && \
echo '' && \
echo '📋 Checking service status...' && \
docker-compose ps
"@

Write-Host "2️⃣  Executing rebuild commands on server..." -ForegroundColor Green
ssh ${serverUser}@${serverIP} $rebuildCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 WHAT'S FIXED:" -ForegroundColor Cyan
    Write-Host "   ✅ Audio distortion (ITU-T G.711 µ-law encoding)" -ForegroundColor White
    Write-Host "   ✅ STT transcription (Deepgram with explicit telephony config)" -ForegroundColor White
    Write-Host "   ✅ Real-time streaming (Deepgram supports it, Whisper doesn't!)" -ForegroundColor White
    Write-Host "   ✅ Transcription logging (debug every speech recognition)" -ForegroundColor White
    Write-Host ""
    Write-Host "📞 TEST NOW:" -ForegroundColor Yellow
    Write-Host "   1. Call your number" -ForegroundColor White
    Write-Host "   2. You'll hear clear greeting (no distortion!)" -ForegroundColor White
    Write-Host "   3. Ask a question (e.g., 'What's the weather?')" -ForegroundColor White
    Write-Host "   4. Bot will respond!" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 WATCH LOGS:" -ForegroundColor Yellow
    Write-Host "   ssh ${serverUser}@${serverIP}" -ForegroundColor White
    Write-Host "   cd ~/asterik-nest" -ForegroundColor White
    Write-Host "   docker-compose logs -f pipecat-agent | grep -E '(DEEPGRAM|Transcribed)'" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 You should see:" -ForegroundColor Cyan
    Write-Host "   🎯 [DEEPGRAM STT] Transcribed: 'your question here'" -ForegroundColor Green
    Write-Host "   📊 [DEEPGRAM STT] Is final: True" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Ensure server is accessible via SSH" -ForegroundColor White
    Write-Host "   2. Check if Docker is running on the server" -ForegroundColor White
    Write-Host "   3. Verify file paths are correct" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

