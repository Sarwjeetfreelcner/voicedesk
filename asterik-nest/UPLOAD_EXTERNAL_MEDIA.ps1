# Upload External Media Implementation Files to Server
# Run this from the asterik-nest directory on Windows

$SERVER = "nortel@your-server-ip"  # UPDATE THIS!
$REMOTE_PATH = "~/asterik-nest"

Write-Host "🚀 Uploading External Media Implementation Files..." -ForegroundColor Cyan
Write-Host ""

# NEW FILES
Write-Host "📁 Creating audio directory on server..." -ForegroundColor Yellow
ssh $SERVER "mkdir -p $REMOTE_PATH/src/audio"

Write-Host "📤 Uploading NEW files..." -ForegroundColor Green
scp "src/audio/rtp-audio-bridge.service.ts" "${SERVER}:${REMOTE_PATH}/src/audio/"
scp "src/audio/audio.module.ts" "${SERVER}:${REMOTE_PATH}/src/audio/"

# MODIFIED FILES
Write-Host "📤 Uploading MODIFIED files..." -ForegroundColor Green
scp "src/incoming-calls/incoming-calls.service.ts" "${SERVER}:${REMOTE_PATH}/src/incoming-calls/"
scp "src/incoming-calls/incoming-calls.module.ts" "${SERVER}:${REMOTE_PATH}/src/incoming-calls/"

Write-Host ""
Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "1. SSH to server: ssh $SERVER"
Write-Host "2. cd ~/asterik-nest"
Write-Host "3. docker-compose --profile ai down"
Write-Host "4. docker-compose --profile ai build --no-cache voicedesk"
Write-Host "5. docker-compose --profile ai up -d"
Write-Host "6. docker-compose logs -f voicedesk"
Write-Host ""
Write-Host "📞 Then make a test call!" -ForegroundColor Yellow
Write-Host ""

