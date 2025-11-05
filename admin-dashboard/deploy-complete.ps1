# Complete Deployment Script for VoiceDesk Admin Dashboard with Integration
# This script will:
# 1. Install admin dashboard dependencies
# 2. Initialize database
# 3. Start backend and frontend
# 4. Rebuild and restart Pipecat with new integration

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   VoiceDesk Admin Dashboard         " -ForegroundColor Cyan
Write-Host "   Complete Deployment Script        " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ADMIN_DASHBOARD_DIR = $PSScriptRoot
$ASTERISK_PROJECT_DIR = Split-Path -Parent $ADMIN_DASHBOARD_DIR

# Function to check if command exists
function Test-CommandExists {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
$prerequisites_ok = $true

if (-not (Test-CommandExists "node")) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    $prerequisites_ok = $false
} else {
    Write-Host "✅ Node.js found" -ForegroundColor Green
}

if (-not (Test-CommandExists "npm")) {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    $prerequisites_ok = $false
} else {
    Write-Host "✅ npm found" -ForegroundColor Green
}

if (-not (Test-CommandExists "docker")) {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    $prerequisites_ok = $false
} else {
    Write-Host "✅ Docker found" -ForegroundColor Green
}

if (-not (Test-CommandExists "psql")) {
    Write-Host "⚠️  PostgreSQL client (psql) not found - will skip DB check" -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL client found" -ForegroundColor Green
}

if (-not $prerequisites_ok) {
    Write-Host ""
    Write-Host "❌ Missing prerequisites. Please install missing software and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Step 1: Install Backend Dependencies" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Set-Location "$ADMIN_DASHBOARD_DIR\backend"

if (Test-Path "package.json") {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ backend/package.json not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Step 2: Install Frontend Dependencies" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Set-Location "$ADMIN_DASHBOARD_DIR\frontend"

if (Test-Path "package.json") {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ frontend/package.json not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Step 3: Initialize Database          " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Set-Location "$ADMIN_DASHBOARD_DIR\backend"

Write-Host "🗄️  Initializing PostgreSQL database..." -ForegroundColor Yellow
npm run init-db
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database initialized successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database initialization had warnings (may be OK if tables exist)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Step 4: Rebuild Pipecat Container   " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Set-Location "$ASTERISK_PROJECT_DIR\asterik-nest"

Write-Host "🐳 Stopping existing containers..." -ForegroundColor Yellow
docker-compose --profile ai down

Write-Host "🔨 Rebuilding Pipecat with transcript integration..." -ForegroundColor Yellow
docker-compose --profile ai build --no-cache pipecat-agent
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pipecat container rebuilt" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to rebuild Pipecat container" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting Docker containers..." -ForegroundColor Yellow
docker-compose --profile ai up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker containers started" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start Docker containers" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE!              " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Backend (Terminal 1):" -ForegroundColor Cyan
Write-Host "   cd $ADMIN_DASHBOARD_DIR\backend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "2. Start Frontend (Terminal 2):" -ForegroundColor Cyan
Write-Host "   cd $ADMIN_DASHBOARD_DIR\frontend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "3. Access Admin Dashboard:" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:3000" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "4. Make a test call to verify integration:" -ForegroundColor Cyan
Write-Host "   Call: +441135117691" -ForegroundColor White
Write-Host "   Have a conversation with the AI" -ForegroundColor White
Write-Host "   Check Transcripts page in dashboard" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Useful Commands:" -ForegroundColor Yellow
Write-Host "   View Pipecat logs: docker-compose logs -f pipecat-agent" -ForegroundColor White
Write-Host "   View all logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop containers: docker-compose --profile ai down" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   Complete Guide: $ADMIN_DASHBOARD_DIR\INTEGRATION_COMPLETE.md" -ForegroundColor White
Write-Host "   Quick Start: $ADMIN_DASHBOARD_DIR\QUICK_START.md" -ForegroundColor White
Write-Host "   Full README: $ADMIN_DASHBOARD_DIR\README.md" -ForegroundColor White
Write-Host ""

Write-Host "✅ All services are ready!" -ForegroundColor Green
Write-Host "   Start the backend and frontend as shown above." -ForegroundColor White
Write-Host ""

# Ask if user wants to start services now
$start_now = Read-Host "Would you like to start the backend and frontend now? (y/n)"

if ($start_now -eq "y" -or $start_now -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Starting Backend..." -ForegroundColor Yellow
    
    # Start backend in new PowerShell window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ADMIN_DASHBOARD_DIR\backend'; npm start"
    
    Write-Host "⏳ Waiting 5 seconds for backend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "🚀 Starting Frontend..." -ForegroundColor Yellow
    
    # Start frontend in new PowerShell window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ADMIN_DASHBOARD_DIR\frontend'; npm start"
    
    Write-Host "⏳ Waiting 5 seconds for frontend to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "✅ Backend and Frontend started in separate windows!" -ForegroundColor Green
    Write-Host "   Backend: http://localhost:5000" -ForegroundColor White
    Write-Host "   Frontend: http://localhost:3000 (should open automatically)" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 You're all set! Login with admin/admin123" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "👍 OK, you can start the services manually later." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

