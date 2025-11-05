# PowerShell script to upload the LOGGER FIX to server
# Run this from: c:\Users\Acer\Desktop\asterisk-project\

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📤 UPLOADING LOGGER FIX TO SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$serverUser = Read-Host "Enter server username (e.g., nortel)"
$serverIP = Read-Host "Enter server IP"

Write-Host ""
Write-Host "🔧 This fixes the logger configuration issue that was causing silent crashes" -ForegroundColor Yellow
Write-Host ""
Write-Host "📦 File to upload:" -ForegroundColor Yellow
Write-Host "  - pipecat-agent/bot_asterisk.py (LOGGER FIX)" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "❌ Upload cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🚀 Uploading file..." -ForegroundColor Green
Write-Host ""

# Upload bot_asterisk.py with logger fix
Write-Host "📤 Uploading bot_asterisk.py..." -ForegroundColor Cyan
scp pipecat-agent/bot_asterisk.py ${serverUser}@${serverIP}:~/pipecat-agent/bot_asterisk.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ bot_asterisk.py uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to upload bot_asterisk.py" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ LOGGER FIX UPLOADED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. SSH to your server:" -ForegroundColor White
Write-Host "   ssh ${serverUser}@${serverIP}" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify the fix:" -ForegroundColor White
Write-Host "   cd ~/pipecat-agent" -ForegroundColor Gray
Write-Host "   grep 'logger.add' bot_asterisk.py" -ForegroundColor Gray
Write-Host "   # Should show: logger.add(sys.stdout, ..." -ForegroundColor Gray
Write-Host ""
Write-Host "3. Rebuild Docker:" -ForegroundColor White
Write-Host "   cd ~/asterik-nest" -ForegroundColor Gray
Write-Host "   docker-compose --profile ai down" -ForegroundColor Gray
Write-Host "   docker rmi asterik-nest-pipecat-agent" -ForegroundColor Gray
Write-Host "   docker-compose --profile ai build --no-cache pipecat-agent" -ForegroundColor Gray
Write-Host "   docker-compose --profile ai up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Watch logs and make test call:" -ForegroundColor White
Write-Host "   docker-compose logs -f pipecat-agent" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 YOU WILL NOW SEE ALL DEBUG LOGS AND HEAR THE BOT!" -ForegroundColor Green
Write-Host ""

