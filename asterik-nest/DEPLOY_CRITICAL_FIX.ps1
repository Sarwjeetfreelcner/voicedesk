# Deploy CRITICAL FIX for Pipecat 0.0.91 VAD blocking issue
# This fixes the "Ignoring user speaking emulation" and lack of transcriptions

Write-Host "🔧 DEPLOYING CRITICAL FIX: Proper VAD configuration for Pipecat 0.0.91" -ForegroundColor Yellow
Write-Host ""
Write-Host "Changes:" -ForegroundColor Cyan
Write-Host "  ✅ Set vad_analyzer=None (disables VAD completely)" -ForegroundColor Green
Write-Host "  ✅ Removed deprecated vad_enabled parameter" -ForegroundColor Green
Write-Host "  ✅ Removed deprecated audio_in_passthrough parameter" -ForegroundColor Green
Write-Host "  ✅ Fixed event handler registration (not supported in 0.0.91)" -ForegroundColor Green
Write-Host ""

# Navigate to project directory
Set-Location -Path $PSScriptRoot

Write-Host "📋 Stopping containers..." -ForegroundColor Yellow
docker-compose --profile ai down

Write-Host "🗑️ Removing old image..." -ForegroundColor Yellow
docker rmi asterik-nest-pipecat-agent 2>$null

Write-Host "📦 Building with clean cache..." -ForegroundColor Yellow
docker-compose --profile ai build --no-cache pipecat-agent

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

Write-Host "🎬 Starting containers..." -ForegroundColor Yellow
docker-compose --profile ai up -d

Write-Host "✅ Deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Watch for these in logs:" -ForegroundColor Cyan
Write-Host "  ✅ '🚫 VAD analyzer: None' (confirms VAD is disabled)" -ForegroundColor White
Write-Host "  ✅ '🎤 Audio input enabled: True' (confirms audio flows)" -ForegroundColor White
Write-Host "  ✅ User messages in transcript (confirms STT working)" -ForegroundColor White
Write-Host "  ❌ NO deprecation warnings" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Showing logs (press Ctrl+C to exit)..." -ForegroundColor Yellow
docker-compose logs -f pipecat-agent

