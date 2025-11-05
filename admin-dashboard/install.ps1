# VoiceDesk AI Admin Dashboard - Automated Installation (Windows)
Write-Host "🚀 VoiceDesk AI Admin Dashboard - Automated Installation" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is accessible
try {
    $pgCheck = psql --version
    Write-Host "✅ PostgreSQL client found" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "🗄️  Initializing Database..." -ForegroundColor Yellow
Set-Location ../backend

# Copy config file
Copy-Item config.env .env

npm run init-db
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database initialization failed" -ForegroundColor Red
    Write-Host "Please check your database credentials in backend/config.env" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor Green
Write-Host "   Password: admin123" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Change the default password after first login!" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 To start the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Terminal 1 (Backend):" -ForegroundColor White
Write-Host "   PS> cd admin-dashboard\backend" -ForegroundColor Gray
Write-Host "   PS> npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "   Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "   PS> cd admin-dashboard\frontend" -ForegroundColor Gray
Write-Host "   PS> npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "   Then open: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy managing! 🎉" -ForegroundColor Green

Set-Location ..

