# PowerShell script to upload ONLY the fixed Pipecat files to server
# Run this from: c:\Users\Acer\Desktop\asterisk-project\

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📤 UPLOADING FIXED PIPECAT FILES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$serverUser = Read-Host "Enter server username (e.g., nortel)"
$serverIP = Read-Host "Enter server IP (e.g., XX.XX.XX.XX)"

Write-Host ""
Write-Host "📦 Files to upload:" -ForegroundColor Yellow
Write-Host "  1. pipecat-agent/bot_asterisk.py" -ForegroundColor White
Write-Host "  2. pipecat-agent/requirements.txt" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "❌ Upload cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🚀 Uploading files..." -ForegroundColor Green
Write-Host ""

# Upload bot_asterisk.py
Write-Host "📤 Uploading bot_asterisk.py..." -ForegroundColor Cyan
scp pipecat-agent/bot_asterisk.py ${serverUser}@${serverIP}:~/pipecat-agent/bot_asterisk.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ bot_asterisk.py uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to upload bot_asterisk.py" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Upload requirements.txt
Write-Host "📤 Uploading requirements.txt..." -ForegroundColor Cyan
scp pipecat-agent/requirements.txt ${serverUser}@${serverIP}:~/pipecat-agent/requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ requirements.txt uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to upload requirements.txt" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ ALL FILES UPLOADED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. SSH to your server:" -ForegroundColor White
Write-Host "   ssh ${serverUser}@${serverIP}" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify files were uploaded correctly:" -ForegroundColor White
Write-Host "   bash asterik-nest/VERIFY_FILES.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Rebuild with --no-cache:" -ForegroundColor White
Write-Host "   cd ~/asterik-nest" -ForegroundColor Gray
Write-Host "   docker-compose --profile ai down" -ForegroundColor Gray
Write-Host "   docker-compose --profile ai build --no-cache pipecat-agent" -ForegroundColor Gray
Write-Host "   docker-compose --profile ai up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Watch logs and make test call:" -ForegroundColor White
Write-Host "   docker-compose logs -f pipecat-agent" -ForegroundColor Gray
Write-Host ""


