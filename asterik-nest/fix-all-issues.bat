@echo off
echo 🔧 FIXING ALL VOICEDESK ISSUES...

echo.
echo 1. Stopping all processes...
taskkill /F /IM node.exe 2>nul
docker stop voicedesk-asterisk-final 2>nul

echo.
echo 2. Creating .env file...
copy env.example .env

echo.
echo 3. Starting Asterisk with correct configuration...
docker run -d --name voicedesk-asterisk-fixed -p 5060:5060/udp -p 8088:8088 -p 10000-10010:10000-10010/udp -v %CD%\asterisk-config:/etc/asterisk andrius/asterisk:18-current

echo.
echo 4. Waiting for Asterisk to start...
timeout /t 20 /nobreak >nul

echo.
echo 5. Testing setup...
node test-final-setup.js

echo.
echo 6. Starting VoiceDesk...
start "VoiceDesk" cmd /k "npm run start:dev"

echo.
echo ✅ SETUP COMPLETE!
echo.
echo 📱 LINPHONE CONFIGURATION:
echo    Server: localhost:5060
echo    Username: 6001
echo    Password: StrongPass123
echo    SIP Domain: localhost
echo.
echo 📞 CALL THIS NUMBER: 01135117691
echo.
pause
