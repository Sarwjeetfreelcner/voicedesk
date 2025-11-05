# Deploy to Linux Server from Windows
# Usage: .\deploy-to-server.ps1

$SERVER_HOST = "nortel@ai-agent-platform"  # Change if different
$SERVER_PATH = "~/asterik-nest"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Deploying to Linux Server" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Copy updated files to server
Write-Host "📤 Uploading updated code to server..." -ForegroundColor Yellow
scp -r ./src "$SERVER_HOST:$SERVER_PATH/"
scp ./docker-compose.yml "$SERVER_HOST:$SERVER_PATH/"
scp ./deploy-with-streaming.sh "$SERVER_HOST:$SERVER_PATH/"
scp ./AUDIO_STREAMING_IMPLEMENTATION.md "$SERVER_HOST:$SERVER_PATH/"

Write-Host "✅ Files uploaded" -ForegroundColor Green
Write-Host ""

# Step 2: Run deployment script on server
Write-Host "🚀 Running deployment on server..." -ForegroundColor Yellow
ssh "$SERVER_HOST" "cd $SERVER_PATH && chmod +x deploy-with-streaming.sh && ./deploy-with-streaming.sh"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " ✅ Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📞 Make a test call to: +441135117691" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 To monitor logs from your Windows machine:" -ForegroundColor Yellow
Write-Host "   ssh $SERVER_HOST 'cd $SERVER_PATH && docker-compose logs -f voicedesk'" -ForegroundColor Gray
Write-Host "   ssh $SERVER_HOST 'cd $SERVER_PATH && docker-compose logs -f pipecat-agent'" -ForegroundColor Gray
Write-Host ""

