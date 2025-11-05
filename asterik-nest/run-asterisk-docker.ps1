# PowerShell script to run Asterisk with Docker Desktop
Write-Host "VoiceDesk Asterisk Docker Setup" -ForegroundColor Green

# Step 1: Check Docker Desktop
Write-Host "`n1. Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker version 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker is available" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is not available. Please start Docker Desktop first." -ForegroundColor Red
        Write-Host "1. Start Docker Desktop from Start Menu" -ForegroundColor Yellow
        Write-Host "2. Wait for it to fully start (green icon in system tray)" -ForegroundColor Yellow
        Write-Host "3. Run this script again" -ForegroundColor Yellow
        pause
        exit
    }
} catch {
    Write-Host "❌ Docker is not available. Please start Docker Desktop first." -ForegroundColor Red
    pause
    exit
}

# Step 2: Check if container already exists
Write-Host "`n2. Checking existing container..." -ForegroundColor Yellow
$existingContainer = docker ps -a --filter "name=voicedesk-asterisk" --format "{{.Names}}" 2>$null
if ($existingContainer -eq "voicedesk-asterisk") {
    Write-Host "✅ Container exists, checking status..." -ForegroundColor Green
    $runningContainer = docker ps --filter "name=voicedesk-asterisk" --format "{{.Names}}" 2>$null
    if ($runningContainer -eq "voicedesk-asterisk") {
        Write-Host "✅ Container is already running" -ForegroundColor Green
    } else {
        Write-Host "🔄 Starting existing container..." -ForegroundColor Yellow
        docker start voicedesk-asterisk
    }
} else {
    Write-Host "🔄 Creating new Asterisk container..." -ForegroundColor Yellow
    docker run -d --name voicedesk-asterisk -p 5060:5060/udp -p 8088:8088 -p 10000-10010:10000-10010/udp andrius/asterisk:18-current
}

# Step 3: Wait for container to start
Write-Host "`n3. Waiting for Asterisk to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 4: Test ARI connection
Write-Host "`n4. Testing ARI connection..." -ForegroundColor Yellow
try {
    $uri = "http://localhost:8088/ari/asterisk/info"
    $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("asterisk:asterisk"))
    $headers = @{Authorization=("Basic {0}" -f $base64AuthInfo)}
    
    $response = Invoke-WebRequest -Uri $uri -Headers $headers -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ ARI connection successful!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ ARI connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Checking container logs..." -ForegroundColor Yellow
    docker logs voicedesk-asterisk
}

# Step 5: Copy configuration files
Write-Host "`n5. Copying configuration files..." -ForegroundColor Yellow
if (Test-Path "asterisk-config/ari.conf") {
    docker cp asterisk-config/ari.conf voicedesk-asterisk:/etc/asterisk/
    Write-Host "✅ ARI config copied" -ForegroundColor Green
} else {
    Write-Host "⚠️ ARI config file not found" -ForegroundColor Yellow
}

if (Test-Path "asterisk-config/pjsip.conf") {
    docker cp asterisk-config/pjsip.conf voicedesk-asterisk:/etc/asterisk/
    Write-Host "✅ SIP config copied" -ForegroundColor Green
} else {
    Write-Host "⚠️ SIP config file not found" -ForegroundColor Yellow
}

if (Test-Path "asterisk-config/extensions.conf") {
    docker cp asterisk-config/extensions.conf voicedesk-asterisk:/etc/asterisk/
    Write-Host "✅ Extensions config copied" -ForegroundColor Green
} else {
    Write-Host "⚠️ Extensions config file not found" -ForegroundColor Yellow
}

# Step 6: Restart container with new config
Write-Host "`n6. Restarting container with new configuration..." -ForegroundColor Yellow
docker restart voicedesk-asterisk
Start-Sleep -Seconds 10

# Step 7: Final ARI test
Write-Host "`n7. Final ARI test..." -ForegroundColor Yellow
try {
    $uri = "http://localhost:8088/ari/asterisk/info"
    $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("asterisk:asterisk"))
    $headers = @{Authorization=("Basic {0}" -f $base64AuthInfo)}
    
    $response = Invoke-WebRequest -Uri $uri -Headers $headers -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ ARI connection successful!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ ARI connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Container logs:" -ForegroundColor Yellow
    docker logs voicedesk-asterisk
}

Write-Host "`nSetup completed!" -ForegroundColor Green
Write-Host "Asterisk is running on:" -ForegroundColor Yellow
Write-Host "- SIP: localhost:5060" -ForegroundColor White
Write-Host "- ARI: http://localhost:8088" -ForegroundColor White
Write-Host "- Username: asterisk" -ForegroundColor White
Write-Host "- Password: asterisk" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Copy client-config.env to .env" -ForegroundColor White
Write-Host "2. Run: npm run start:dev" -ForegroundColor White
Write-Host "3. Run: node test-client-call.js" -ForegroundColor White

Write-Host "`nTo stop Asterisk: docker stop voicedesk-asterisk" -ForegroundColor Cyan
Write-Host "To remove Asterisk: docker rm voicedesk-asterisk" -ForegroundColor Cyan

pause
