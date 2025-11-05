# 🔊 AUDIO CLARITY FIX: Upload µ-law & TTS Optimizations

Write-Host "🔊 AUDIO CLARITY FIX" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "This fix improves bot voice clarity by:" -ForegroundColor White
Write-Host "  ✅ Using ITU-T G.711 reference µ-law encoding" -ForegroundColor Green
Write-Host "  ✅ Optimizing ElevenLabs TTS output quality" -ForegroundColor Green
Write-Host ""

# Get server details
$serverIP = Read-Host "Enter your server IP (e.g., 123.456.789.0)"
$serverUser = Read-Host "Enter your SSH username (default: nortel)"
if ([string]::IsNullOrWhiteSpace($serverUser)) { $serverUser = "nortel" }

Write-Host ""
Write-Host "📤 Uploading audio clarity fixes..." -ForegroundColor Yellow
Write-Host ""

# Upload RTP bridge (µ-law encoding fix)
Write-Host "1️⃣  Uploading RTP audio bridge (ITU-T µ-law encoding)..." -ForegroundColor Green
scp .\src\audio\rtp-audio-bridge.service.ts ${serverUser}@${serverIP}:~/asterik-nest/src/audio/

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Failed to upload rtp-audio-bridge.service.ts" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ rtp-audio-bridge.service.ts uploaded!" -ForegroundColor Green

Write-Host ""

# Upload Pipecat bot (TTS optimization)
Write-Host "2️⃣  Uploading Pipecat bot (TTS output optimization)..." -ForegroundColor Green
scp ..\pipecat-agent\bot_asterisk.py ${serverUser}@${serverIP}:~/pipecat-agent/

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Failed to upload bot_asterisk.py" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ bot_asterisk.py uploaded!" -ForegroundColor Green

Write-Host ""
Write-Host "🏗️  Rebuilding Docker containers..." -ForegroundColor Yellow
Write-Host ""

# Rebuild commands
$rebuildCommands = @"
cd ~/asterik-nest && \
echo '🔄 Stopping services...' && \
docker-compose down && \
echo '🗑️  Removing old images...' && \
docker rmi asterik-nest-voicedesk asterik-nest-pipecat-agent 2>/dev/null || true && \
echo '🏗️  Building BOTH services with NO cache...' && \
docker-compose --profile ai build --no-cache && \
echo '🚀 Starting all services...' && \
docker-compose --profile ai up -d && \
echo '' && \
echo '✅ Deployment complete!' && \
echo '' && \
echo '📋 Checking service status...' && \
docker-compose ps
"@

Write-Host "3️⃣  Executing rebuild on server..." -ForegroundColor Green
ssh ${serverUser}@${serverIP} $rebuildCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ AUDIO CLARITY FIX DEPLOYED!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 WHAT'S IMPROVED:" -ForegroundColor Cyan
    Write-Host "   ✅ ITU-T G.711 reference µ-law encoding (professional standard)" -ForegroundColor White
    Write-Host "   ✅ ElevenLabs 16kHz PCM output (higher quality before compression)" -ForegroundColor White
    Write-Host "   ✅ Binary search algorithm (more accurate encoding)" -ForegroundColor White
    Write-Host "   ✅ Optimized audio pipeline (no quality loss)" -ForegroundColor White
    Write-Host ""
    Write-Host "📞 TEST NOW:" -ForegroundColor Yellow
    Write-Host "   1. Call your number" -ForegroundColor White
    Write-Host "   2. Listen to the greeting - should be CRYSTAL CLEAR!" -ForegroundColor White
    Write-Host "   3. Ask questions - bot voice should sound professional!" -ForegroundColor White
    Write-Host ""
    Write-Host "🔊 EXPECTED QUALITY:" -ForegroundColor Yellow
    Write-Host "   BEFORE: 'H..ll.. I'm y..r AI ass..tant...' (muffled/distorted) ❌" -ForegroundColor Red
    Write-Host "   AFTER:  'Hello! I'm your AI assistant...' (crystal clear!) ✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 WATCH LOGS (optional):" -ForegroundColor Yellow
    Write-Host "   ssh ${serverUser}@${serverIP}" -ForegroundColor White
    Write-Host "   cd ~/asterik-nest" -ForegroundColor White
    Write-Host "   docker-compose logs -f voicedesk pipecat-agent" -ForegroundColor White
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

