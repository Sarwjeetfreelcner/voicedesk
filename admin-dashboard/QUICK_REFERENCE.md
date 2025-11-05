# 🚀 Quick Reference Card

## One-Page Cheat Sheet for VoiceDesk Admin Dashboard

---

## 📦 INSTALLATION (One Command)

```powershell
cd C:\Users\Acer\Desktop\asterisk-project\admin-dashboard
.\deploy-complete.ps1
```

**What it does:**

- ✅ Installs all dependencies
- ✅ Initializes PostgreSQL database
- ✅ Rebuilds Pipecat with transcript integration
- ✅ Starts Docker containers
- ✅ Offers to start backend & frontend

---

## 🚀 MANUAL START

### **Terminal 1 - Backend:**

```powershell
cd admin-dashboard\backend
npm start
```

### **Terminal 2 - Frontend:**

```powershell
cd admin-dashboard\frontend
npm start
```

### **Terminal 3 - Docker:**

```powershell
cd asterik-nest
docker-compose --profile ai up -d
```

---

## 🔗 ACCESS POINTS

| Service             | URL                          | Credentials         |
| ------------------- | ---------------------------- | ------------------- |
| **Admin Dashboard** | http://localhost:3000        | admin / admin123    |
| **Backend API**     | http://localhost:5000        | -                   |
| **API Health**      | http://localhost:5000/health | -                   |
| **Asterisk ARI**    | http://localhost:8088        | asterisk / asterisk |
| **Pipecat Agent**   | http://localhost:8080        | -                   |

---

## 📊 DATABASE

```bash
# Connect to PostgreSQL
psql -U voiceaiuser -d voice-ai
# Password: P@ssw0rd12345

# View tables
\dt

# View calls
SELECT * FROM call_transcripts ORDER BY created_at DESC LIMIT 10;

# Count calls
SELECT COUNT(*) FROM call_transcripts;
```

---

## 🐳 DOCKER COMMANDS

```powershell
# Start all services
docker-compose --profile ai up -d

# Stop all services
docker-compose --profile ai down

# Rebuild Pipecat
docker-compose --profile ai build --no-cache pipecat-agent

# View logs
docker-compose logs -f pipecat-agent
docker-compose logs -f voicedesk
docker-compose logs -f asterisk

# View all logs
docker-compose logs -f

# Check status
docker-compose ps
```

---

## 📋 API ENDPOINTS

### **Authentication:**

```bash
POST /api/login
POST /api/logout
```

### **Transcripts:**

```bash
GET  /api/transcripts          # List all
GET  /api/transcripts/:id      # Get one
POST /api/transcripts          # Create/update (used by Pipecat)
```

### **Prompts:**

```bash
GET    /api/prompts            # List all
GET    /api/prompts/active     # Get active
POST   /api/prompts            # Create
PUT    /api/prompts/:id        # Update
DELETE /api/prompts/:id        # Delete
POST   /api/prompts/:id/activate  # Activate
```

### **Greetings:**

```bash
GET    /api/greetings          # List all
GET    /api/greetings/active   # Get active
POST   /api/greetings          # Create
PUT    /api/greetings/:id      # Update
DELETE /api/greetings/:id      # Delete
POST   /api/greetings/:id/activate  # Activate
```

---

## 🧪 TEST TRANSCRIPT SAVE

```powershell
# Test API directly
curl -X POST http://localhost:5000/api/transcripts `
  -H "Content-Type: application/json" `
  -d '{
    "call_id": "test_123",
    "caller_number": "1234567890",
    "status": "completed",
    "messages": [
      {"role": "assistant", "content": "Hello!"},
      {"role": "user", "content": "Hi there"}
    ]
  }'

# Should return: {"success":true,"transcriptId":1}
```

---

## 🔍 TROUBLESHOOTING

### **Backend won't start:**

```powershell
cd admin-dashboard\backend
npm install
npm start
```

### **Frontend won't start:**

```powershell
cd admin-dashboard\frontend
npm install
npm start
```

### **Database connection failed:**

```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Start if stopped
Start-Service postgresql-x64-XX
```

### **No transcripts appearing:**

```powershell
# Check Pipecat logs
docker-compose logs pipecat-agent | Select-String "ADMIN DASHBOARD"

# Should see:
# ✅ [ADMIN DASHBOARD] Transcript saved for call...
```

### **Docker container can't reach host:**

```powershell
# Use your local IP instead of host.docker.internal
ipconfig  # Find your IPv4 Address

# Set environment variable
$env:ADMIN_API_URL="http://192.168.1.X:5000/api"

# Restart containers
docker-compose --profile ai down
docker-compose --profile ai up -d
```

---

## 📁 FILE LOCATIONS

```
asterisk-project/
├── asterik-nest/
│   ├── docker-compose.yml          ← Docker config
│   └── src/                        ← NestJS code
│
├── pipecat-agent/
│   ├── bot_asterisk_fixed.py       ← Main bot (MODIFIED)
│   ├── app.py                      ← FastAPI app
│   └── requirements.txt            ← Python deps
│
└── admin-dashboard/                ← NEW!
    ├── backend/
    │   ├── server.js               ← API server
    │   ├── config.env              ← Config (DB credentials)
    │   └── scripts/init-db.js      ← DB setup
    │
    ├── frontend/
    │   └── src/                    ← React app
    │
    └── Documentation/
        ├── README.md
        ├── QUICK_START.md
        ├── INTEGRATION_COMPLETE.md
        ├── SYSTEM_ARCHITECTURE.md
        └── QUICK_REFERENCE.md      ← This file
```

---

## 🔐 SECURITY

### **Change default admin password:**

```sql
psql -U voiceaiuser -d voice-ai
UPDATE admin_users
SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf'))
WHERE username = 'admin';
```

### **Update JWT secret:**

Edit `backend/config.env`:

```env
JWT_SECRET=your-very-long-random-secret-here
```

---

## 📞 TEST CALL FLOW

1. **Call:** +441135117691
2. **AI greets:** "Hello! How can I help you?"
3. **User speaks:** "I need help"
4. **AI responds:** "I'd be happy to help! What do you need?"
5. **Continue conversation**
6. **Hang up**
7. **Check dashboard:** Transcripts page → See new call

---

## 🔥 COMMON TASKS

### **View recent calls:**

```sql
SELECT call_id, caller_number, status, created_at
FROM call_transcripts
ORDER BY created_at DESC
LIMIT 10;
```

### **Export transcript:**

```sql
SELECT messages
FROM call_transcripts
WHERE call_id = 'call_xxx';
```

### **Delete old calls:**

```sql
DELETE FROM call_transcripts
WHERE created_at < NOW() - INTERVAL '30 days';
```

### **Get active prompt:**

```sql
SELECT * FROM system_prompts WHERE is_active = true;
```

### **Get active greeting:**

```sql
SELECT * FROM greeting_messages WHERE is_active = true;
```

---

## 🎯 QUICK CHECKS

✅ **Is backend running?**

```powershell
curl http://localhost:5000/health
# Should return: {"status":"ok"}
```

✅ **Is frontend running?**

```powershell
# Open browser: http://localhost:3000
# Should see login page
```

✅ **Are Docker containers running?**

```powershell
docker-compose ps
# Should show: asterisk, voicedesk, pipecat-agent (all "Up")
```

✅ **Can Pipecat reach admin dashboard?**

```powershell
docker-compose logs pipecat-agent | Select-String "ADMIN DASHBOARD"
# After a test call, should see: "✅ [ADMIN DASHBOARD] Transcript saved"
```

---

## 📊 MONITORING

### **Real-time logs:**

```powershell
# Pipecat (shows transcript saves)
docker-compose logs -f pipecat-agent

# Voicedesk (shows call flow)
docker-compose logs -f voicedesk

# All services
docker-compose logs -f
```

### **Check disk space:**

```powershell
# Database size
psql -U voiceaiuser -d voice-ai -c "SELECT pg_size_pretty(pg_database_size('voice-ai'));"

# Docker volumes
docker system df
```

---

## 🔄 RESTART SERVICES

```powershell
# Restart everything
cd asterik-nest
docker-compose --profile ai restart

# Restart specific service
docker-compose restart pipecat-agent

# Restart backend (Ctrl+C in terminal, then)
npm start

# Restart frontend (Ctrl+C in terminal, then)
npm start
```

---

## 🎉 SUCCESS INDICATORS

✅ Backend shows: `🚀 VoiceDesk Admin Backend running on port 5000`  
✅ Frontend shows: `Compiled successfully!`  
✅ Login works with admin/admin123  
✅ Make test call → AI responds  
✅ Transcript appears in dashboard  
✅ Can view full conversation  
✅ Logs show: `✅ [ADMIN DASHBOARD] Transcript saved`

---

## 📚 MORE HELP

| Document                  | Purpose                   |
| ------------------------- | ------------------------- |
| `README.md`               | Full system documentation |
| `QUICK_START.md`          | 5-minute setup guide      |
| `INTEGRATION_COMPLETE.md` | Integration details       |
| `SYSTEM_ARCHITECTURE.md`  | Architecture diagrams     |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment   |

---

## 🆘 EMERGENCY

**Something not working?**

1. **Check logs:**

   ```powershell
   docker-compose logs -f
   ```

2. **Restart everything:**

   ```powershell
   docker-compose --profile ai down
   docker-compose --profile ai up -d
   ```

3. **Rebuild from scratch:**

   ```powershell
   cd admin-dashboard
   .\deploy-complete.ps1
   ```

4. **Check documentation:**
   ```powershell
   code admin-dashboard\INTEGRATION_COMPLETE.md
   ```

---

## 📞 SUPPORT

- 📖 **Documentation:** `admin-dashboard/` directory
- 🐛 **Logs:** `docker-compose logs -f`
- 🔍 **Database:** `psql -U voiceaiuser -d voice-ai`
- 🌐 **API Test:** `curl http://localhost:5000/health`

---

**💡 Tip:** Keep this file open in a separate window for quick reference!

---

_Quick Reference v1.0 - Last Updated: October 30, 2025_
