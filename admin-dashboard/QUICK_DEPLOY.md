# ⚡ QUICK DEPLOY - 3 Commands!

## 🚀 Deploy in 3 Steps (5 minutes)

You're on server `ai-agent-platform` with everything ready!

---

## 📋 Prerequisites (Already Done ✅)

- ✅ Files copied to `~/admin-dashboard`
- ✅ Database initialized
- ✅ Config.env updated
- ✅ Node.js and npm installed

---

## 🎯 DEPLOY NOW

### **Option 1: Automated Script (Recommended)**

```bash
cd ~/admin-dashboard

# Make script executable
chmod +x deploy-server.sh

# Run deployment
./deploy-server.sh
```

**That's it!** The script will:
1. Install PM2
2. Install all dependencies
3. Build frontend
4. Start backend
5. Start frontend
6. Save PM2 config
7. Show you the access URLs

---

### **Option 2: Manual (3 Commands)**

```bash
# 1. Install PM2 and dependencies
sudo npm install -g pm2 serve
cd ~/admin-dashboard/backend && npm install
cd ~/admin-dashboard/frontend && npm install && npm run build

# 2. Start backend
cd ~/admin-dashboard/backend
pm2 start npm --name "voicedesk-admin-api" -- start

# 3. Start frontend
cd ~/admin-dashboard/frontend
pm2 start serve --name "voicedesk-admin-ui" -- -s build -l 3000

# Save PM2 config
pm2 save
pm2 startup  # Follow the command it gives
```

---

## ✅ VERIFY IT'S WORKING

```bash
# 1. Check PM2 status
pm2 status

# Should show both services as "online"

# 2. Check backend health
curl http://localhost:5000/health

# Should return: {"status":"ok"}

# 3. Get your server IP
curl ifconfig.me

# Note this IP address!
```

---

## 🌐 ACCESS THE DASHBOARD

**Get your server IP:**
```bash
curl ifconfig.me
```

**Open in your browser:**
```
http://YOUR_SERVER_IP:3000
```

**Login with:**
- Username: `admin`
- Password: `admin123`

---

## 🔥 QUICK COMMANDS

```bash
# View logs (real-time)
pm2 logs

# Restart everything
pm2 restart all

# Stop everything
pm2 stop all

# Check status
pm2 status

# View last 50 log lines
pm2 logs --lines 50
```

---

## 🧪 TEST TRANSCRIPT SAVING

1. **Make a call** to: `+441135117691`
2. **Have a conversation** with the AI
3. **Hang up**
4. **Open dashboard** → Transcripts page
5. **See your call!** 🎉

---

## 🔥 TROUBLESHOOTING

### **Backend not starting?**
```bash
pm2 logs voicedesk-admin-api --lines 50
# Check for errors

# Restart
pm2 restart voicedesk-admin-api
```

### **Frontend not loading?**
```bash
# Rebuild
cd ~/admin-dashboard/frontend
npm run build

# Restart
pm2 restart voicedesk-admin-ui
```

### **Can't access from browser?**
```bash
# Open firewall ports
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

---

## 📞 NEED HELP?

**Check logs:**
```bash
pm2 logs
```

**Check database:**
```bash
psql -U voiceaiuser -d voice-ai
SELECT * FROM admin_users;
\q
```

**Test SMTP:**
```bash
cd ~/admin-dashboard/backend
node -e "const nm=require('nodemailer');const t=nm.createTransport({host:'relay.sodahost.co.uk',port:26,secure:false});t.verify((e,s)=>console.log(e?'❌ '+e:'✅ Ready'));"
```

---

## ✅ CHECKLIST

- [ ] Run deploy script OR manual commands
- [ ] Check `pm2 status` - both services online
- [ ] Test `curl http://localhost:5000/health`
- [ ] Get server IP: `curl ifconfig.me`
- [ ] Open `http://YOUR_IP:3000` in browser
- [ ] Login with admin/admin123
- [ ] Make test call
- [ ] Check Transcripts page
- [ ] ✅ **DONE!**

---

## 🎉 YOU'RE LIVE!

Your VoiceDesk Admin Dashboard is now running on your server!

**Access:** `http://YOUR_SERVER_IP:3000`  
**Login:** `admin` / `admin123`  
**Status:** `pm2 status`  

**Change admin password after first login!**

---

*Deployment time: ~5 minutes*  
*Server: ai-agent-platform*  
*Ready to use!* ✅

