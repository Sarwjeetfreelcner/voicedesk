# Quick Upload Script - Run this from PowerShell
# Location: C:\Users\Acer\Desktop\asterisk-project

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Uploading Updated Files to Server" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Replace with your actual server details
$SERVER = "nortel@YOUR_SERVER_IP"  # Change this!

Write-Host "📤 Uploading asterisk.service.ts..." -ForegroundColor Yellow
scp asterik-nest\src\asterisk\asterisk.service.ts "${SERVER}:~/asterik-nest/src/asterisk/"

Write-Host "📤 Uploading incoming-calls.service.ts..." -ForegroundColor Yellow
scp asterik-nest\src\incoming-calls\incoming-calls.service.ts "${SERVER}:~/asterik-nest/src/incoming-calls/"

Write-Host ""
Write-Host "✅ Files uploaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Now SSH to your server and run:" -ForegroundColor Yellow
Write-Host "  cd ~/asterik-nest" -ForegroundColor Gray
Write-Host "  docker-compose down" -ForegroundColor Gray
Write-Host "  docker-compose --profile ai build --no-cache voicedesk" -ForegroundColor Gray
Write-Host "  docker-compose --profile ai up -d" -ForegroundColor Gray
Write-Host "  docker-compose logs -f voicedesk" -ForegroundColor Gray
Write-Host ""

