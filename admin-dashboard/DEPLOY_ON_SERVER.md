# 🚀 DEPLOY ON ai-agent-platform SERVER

## ✅ Current Status

- ✅ Files copied to server: `~/admin-dashboard`
- ✅ Database initialized successfully
- ✅ Tables created
- ✅ Default admin user created
- ✅ Config updated with server details

---

## 📋 CONFIGURATION SUMMARY

### **Server Details:**
- **Hostname:** ai-agent-platform
- **Database:** PostgreSQL (voice-ai)
- **Admin User:** admin / admin123
- **Email Relay:** relay.sodahost.co.uk:26 (IP-auth, no credentials)

### **Configuration Updated:**
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
SMTP_HOST=relay.sodahost.co.uk
SMTP_PORT=26
REQUIRE_EMAIL_VERIFICATION=false  ← Disabled until frontend ready
APP_URL=http://ai-agent-platform:3000
```

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Get Server IP Address**

```bash
# Get your server's public IP
curl ifconfig.me

# Or internal IP
hostname -I
```

**Save this IP - you'll need it to access the dashboard!**

---

### **Step 2: Install PM2 (Process Manager)**

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

### **Step 3: Start Backend with PM2**

```bash
cd ~/admin-dashboard/backend

# Start backend
pm2 start npm --name "voicedesk-admin-api" -- start

# Check status
pm2 status

# View logs
pm2 logs voicedesk-admin-api --lines 50
```

**Expected logs:**
```
✅ SMTP Server is ready to send emails
🚀 VoiceDesk Admin Backend running on port 5000
📊 Environment: production
💾 Database: localhost:5432/voice-ai
```

---

### **Step 4: Save PM2 Configuration**

```bash
# Save current PM2 processes
pm2 save

# Set PM2 to start on server reboot
pm2 startup

# Copy and run the command it gives you (with sudo)
# It will look like: sudo env PATH=$PATH:/usr/bin ...
```

---

### **Step 5: Build Frontend**

```bash
cd ~/admin-dashboard/frontend

# Install dependencies (if not already done)
npm install

# Build for production
npm run build
```

This creates `frontend/build/` directory with optimized static files.

---

### **Step 6: Serve Frontend with PM2**

```bash
cd ~/admin-dashboard/frontend

# Install serve package
npm install -g serve

# Start frontend with PM2
pm2 start serve --name "voicedesk-admin-ui" -- -s build -l 3000

# Check status
pm2 status

# Save configuration
pm2 save
```

---

### **Step 7: Configure Firewall**

```bash
# Allow ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 5000/tcp  # Backend API
sudo ufw allow 80/tcp    # HTTP (optional)
sudo ufw allow 443/tcp   # HTTPS (optional)

# Enable firewall (if not already enabled)
sudo ufw enable

# Check status
sudo ufw status
```

---

### **Step 8: Test Everything**

#### **A. Test Backend API:**
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok"}
```

#### **B. Test Frontend:**
```bash
curl http://localhost:3000
# Should return HTML
```

#### **C. Test from Your Browser:**

**Get your server IP:**
```bash
curl ifconfig.me
# Example output: 203.0.113.45
```

**Open in browser:**
- **Frontend:** `http://YOUR_SERVER_IP:3000`
- **API:** `http://YOUR_SERVER_IP:5000/health`

**Login with:**
- Username: `admin`
- Password: `admin123`

---

### **Step 9: Update Pipecat to Use Admin Dashboard**

```bash
cd ~/asterik-nest

# Edit docker-compose.yml
nano docker-compose.yml
```

**Find the pipecat-agent section and update:**

```yaml
pipecat-agent:
  environment:
    # Change ADMIN_API_URL to use server IP
    - ADMIN_API_URL=http://localhost:5000/api
    # Or use the service name since they're in same docker network
```

**Restart Pipecat:**
```bash
docker-compose --profile ai down
docker-compose --profile ai up -d

# Check logs
docker-compose logs -f pipecat-agent
```

---

## ✅ VERIFICATION CHECKLIST

Run these commands to verify everything is working:

### **1. Check PM2 Processes:**
```bash
pm2 status
```

**Expected output:**
```
┌────┬─────────────────────┬─────────┬─────────┬──────────┐
│ id │ name                │ status  │ cpu     │ memory   │
├────┼─────────────────────┼─────────┼─────────┼──────────┤
│ 0  │ voicedesk-admin-api │ online  │ 0%      │ 50.0 MB  │
│ 1  │ voicedesk-admin-ui  │ online  │ 0%      │ 30.0 MB  │
└────┴─────────────────────┴─────────┴─────────┴──────────┘
```

### **2. Check Backend Logs:**
```bash
pm2 logs voicedesk-admin-api --lines 50
```

**Should show:**
```
✅ SMTP Server is ready to send emails
🚀 VoiceDesk Admin Backend running on port 5000
```

### **3. Test Backend Health:**
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok"}
```

### **4. Test Login API:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Should return JWT token and user data.**

### **5. Test SMTP:**
```bash
cd ~/admin-dashboard/backend

node -e "const nm=require('nodemailer');const t=nm.createTransport({host:'relay.sodahost.co.uk',port:26,secure:false});t.verify((e,s)=>console.log(e?'❌ '+e:'✅ SMTP Ready'));"
```

**Expected:** `✅ SMTP Ready`

### **6. Make a Test Call:**

Call your Asterisk number: `+441135117691`

**Check if transcript is saved:**
```bash
# View Pipecat logs
docker-compose logs pipecat-agent | grep "ADMIN DASHBOARD"

# Should see:
# ✅ [ADMIN DASHBOARD] Call status updated: active
# ✅ [ADMIN DASHBOARD] Transcript saved for call call_xxx
```

**Check in dashboard:**
- Open `http://YOUR_SERVER_IP:3000`
- Login
- Go to Transcripts page
- Should see your call!

---

## 📊 USEFUL COMMANDS

### **PM2 Management:**
```bash
# View all processes
pm2 status

# View logs (real-time)
pm2 logs voicedesk-admin-api
pm2 logs voicedesk-admin-ui

# View last 100 log lines
pm2 logs voicedesk-admin-api --lines 100

# Restart services
pm2 restart voicedesk-admin-api
pm2 restart voicedesk-admin-ui

# Stop services
pm2 stop voicedesk-admin-api
pm2 stop voicedesk-admin-ui

# Delete services
pm2 delete voicedesk-admin-api
pm2 delete voicedesk-admin-ui

# Monitor (dashboard)
pm2 monit
```

### **Database Management:**
```bash
# Connect to database
psql -U voiceaiuser -d voice-ai

# View tables
\dt

# View admin users
SELECT id, username, email, is_verified, created_at FROM admin_users;

# View call transcripts
SELECT call_id, caller_number, status, created_at FROM call_transcripts ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

### **Check Ports:**
```bash
# See what's running on port 3000
sudo netstat -tulpn | grep 3000

# See what's running on port 5000
sudo netstat -tulpn | grep 5000
```

### **Restart Everything:**
```bash
# Restart all PM2 processes
pm2 restart all

# Or restart individually
pm2 restart voicedesk-admin-api
pm2 restart voicedesk-admin-ui
```

---

## 🐛 TROUBLESHOOTING

### **Problem: Backend won't start**

```bash
# Check logs
pm2 logs voicedesk-admin-api --lines 100

# Common issues:
# 1. Port already in use
sudo netstat -tulpn | grep 5000
# Kill process if needed
sudo kill -9 <PID>

# 2. Database connection error
sudo systemctl status postgresql
psql -U voiceaiuser -d voice-ai -c "SELECT 1"

# 3. Missing dependencies
cd ~/admin-dashboard/backend
npm install
```

### **Problem: Frontend not accessible**

```bash
# Check if it's running
pm2 status

# Check logs
pm2 logs voicedesk-admin-ui

# Rebuild frontend
cd ~/admin-dashboard/frontend
npm run build

# Restart frontend
pm2 restart voicedesk-admin-ui
```

### **Problem: Can't access from browser**

```bash
# Check firewall
sudo ufw status

# Make sure ports are open
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp

# Check if services are listening on correct interface
sudo netstat -tulpn | grep -E "3000|5000"
```

### **Problem: SMTP not working**

```bash
# Test SMTP connection
telnet relay.sodahost.co.uk 26

# Check if server can reach SMTP relay
ping relay.sodahost.co.uk

# Check backend logs for SMTP errors
pm2 logs voicedesk-admin-api | grep -i smtp
```

### **Problem: Transcripts not saving**

```bash
# Check Pipecat logs
cd ~/asterik-nest
docker-compose logs pipecat-agent | grep "ADMIN DASHBOARD"

# Check if Pipecat can reach backend
docker exec pipecat-agent curl http://localhost:5000/health

# Check backend logs
pm2 logs voicedesk-admin-api | grep transcript
```

---

## 🔐 SECURITY CHECKLIST

### **Before Going Live:**

1. ✅ **Change default admin password**
   ```bash
   psql -U voiceaiuser -d voice-ai
   UPDATE admin_users 
   SET password_hash = crypt('YourNewSecurePassword', gen_salt('bf')) 
   WHERE username = 'admin';
   ```

2. ✅ **Update JWT secret** in `config.env` (already done)

3. ✅ **Set up HTTPS** (use Nginx + Let's Encrypt)

4. ✅ **Enable firewall**
   ```bash
   sudo ufw enable
   ```

5. ✅ **Regular backups**
   ```bash
   # Backup database
   pg_dump -U voiceaiuser voice-ai > backup_$(date +%Y%m%d).sql
   ```

6. ✅ **Monitor logs regularly**
   ```bash
   pm2 logs
   ```

---

## 📈 PERFORMANCE MONITORING

### **Monitor System Resources:**
```bash
# CPU and memory usage
htop

# Disk space
df -h

# PM2 monitoring dashboard
pm2 monit
```

### **View Application Metrics:**
```bash
# PM2 web interface (optional)
pm2 plus
```

---

## 🎯 NEXT STEPS

1. ✅ **Test login:** `http://YOUR_SERVER_IP:3000`
2. ✅ **Make test call:** Check transcripts page
3. ✅ **Change admin password**
4. ✅ **Set up domain** (optional, for HTTPS)
5. ✅ **Configure backup** (database)
6. ✅ **Monitor logs** for any errors

---

## 📞 QUICK ACCESS URLS

**Replace `YOUR_SERVER_IP` with your actual IP:**

- **Frontend:** `http://YOUR_SERVER_IP:3000`
- **Backend API:** `http://YOUR_SERVER_IP:5000/api`
- **Health Check:** `http://YOUR_SERVER_IP:5000/health`

**Default Login:**
- Username: `admin`
- Password: `admin123`

---

## 🎉 YOU'RE DONE!

Your VoiceDesk Admin Dashboard is now running on your server!

**Everything is configured to use:**
- ✅ Server hostname: `ai-agent-platform`
- ✅ Database: PostgreSQL (localhost)
- ✅ SMTP Relay: `relay.sodahost.co.uk:26` (IP-auth)
- ✅ Email verification: Disabled (can enable later)

**Test it now:**
1. Get your server IP: `curl ifconfig.me`
2. Open: `http://YOUR_IP:3000`
3. Login: `admin` / `admin123`
4. Make a call to test transcript saving!

---

*Deployment completed on: October 30, 2025*  
*Server: ai-agent-platform*  
*Status: ✅ READY TO USE!*

