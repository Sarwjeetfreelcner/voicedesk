# PowerShell script to fix Docker and test ARI
Write-Host "VoiceDesk Asterisk Setup Fix" -ForegroundColor Green

# Check if Docker Desktop is running
Write-Host "`n1. Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker is available: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is not available" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Docker is not available" -ForegroundColor Red
}

# Check if Docker Desktop is running
Write-Host "`n2. Checking Docker Desktop status..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>$null
    if ($dockerInfo) {
        Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker Desktop is not running" -ForegroundColor Red
        Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Docker Desktop is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
}

# Test ARI connection with proper PowerShell syntax
Write-Host "`n3. Testing ARI connection..." -ForegroundColor Yellow
try {
    $uri = "http://localhost:8088/ari/asterisk/info"
    $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("asterisk:asterisk"))
    $headers = @{Authorization=("Basic {0}" -f $base64AuthInfo)}
    
    $response = Invoke-WebRequest -Uri $uri -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ ARI connection successful!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ ARI connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Asterisk is not running on localhost:8088" -ForegroundColor Yellow
}

# Check if Asterisk container is running
Write-Host "`n4. Checking Asterisk container..." -ForegroundColor Yellow
try {
    $containers = docker ps -a --filter "name=voicedesk-asterisk" 2>$null
    if ($containers -match "voicedesk-asterisk") {
        Write-Host "✅ Asterisk container exists" -ForegroundColor Green
        $running = docker ps --filter "name=voicedesk-asterisk" 2>$null
        if ($running -match "voicedesk-asterisk") {
            Write-Host "✅ Asterisk container is running" -ForegroundColor Green
        } else {
            Write-Host "❌ Asterisk container is not running" -ForegroundColor Red
            Write-Host "Starting container..." -ForegroundColor Yellow
            docker start voicedesk-asterisk
        }
    } else {
        Write-Host "❌ Asterisk container does not exist" -ForegroundColor Red
        Write-Host "Creating container..." -ForegroundColor Yellow
        docker run -d --name voicedesk-asterisk -p 5060:5060/udp -p 8088:8088 -p 10000-10010:10000-10010/udp andrius/asterisk:18-current
    }
} catch {
    Write-Host "❌ Docker command failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nSetup completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Docker Desktop if not running" -ForegroundColor White
Write-Host "2. Run this script again" -ForegroundColor White
Write-Host "3. Test VoiceDesk: npm run start:dev" -ForegroundColor White

