# 🚀 START DEPLOYMENT - Your Server is Ready!

## ✅ Server Information

**Server:** `ai-agent-platform`  
**IP Address:** `195.34.79.69`  
**Database:** ✅ Initialized  
**Configuration:** ✅ Updated  

---

## ⚡ DEPLOY NOW (1 Command!)

```bash
cd ~/admin-dashboard
chmod +x DEPLOY_NOW.sh
./DEPLOY_NOW.sh
```

**That's it!** This will:
1. Install PM2 and dependencies
2. Install backend packages
3. Install & build frontend
4. Start both services
5. Show you access URLs

**Time:** ~3-5 minutes

---

## 🌐 YOUR ACCESS URLS

After deployment, access your dashboard:

**Frontend (Login Page):**
```
http://195.34.79.69:3000
```

**Backend API:**
```
http://195.34.79.69:5000/api
```

**Health Check:**
```
http://195.34.79.69:5000/health
```

---

## 🔑 LOGIN CREDENTIALS

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT: Change this password after first login!**

---

## 🔥 OPEN FIREWALL PORTS

```bash
# Allow access from outside
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
```

---

## ✅ VERIFY DEPLOYMENT

### **1. Check Services:**
```bash
pm2 status
```

Expected output:
```
┌────┬─────────────────────┬─────────┬─────────┬──────────┐
│ id │ name                │ status  │ cpu     │ memory   │
├────┼─────────────────────┼─────────┼─────────┼──────────┤
│ 0  │ voicedesk-admin-api │ online  │ 0%      │ 50.0 MB  │
│ 1  │ voicedesk-admin-ui  │ online  │ 0%      │ 30.0 MB  │
└────┴─────────────────────┴─────────┴─────────┴──────────┘
```

### **2. Test Health:**
```bash
curl http://localhost:5000/health
```

Expected: `{"status":"ok"}`

### **3. Test from Browser:**
Open: `http://195.34.79.69:3000`

Should see the login page!

---

## 🧪 TEST TRANSCRIPT SAVING

1. **Make a call** to: `+441135117691`
2. **Have a conversation** with the AI
3. **Hang up**
4. **Open dashboard:** `http://195.34.79.69:3000`
5. **Go to Transcripts page**
6. **See your call!** 🎉

---

## 📧 EMAIL CONFIGURATION

✅ **SMTP Relay:** `relay.sodahost.co.uk:26`  
✅ **IP Authentication:** No credentials needed  
✅ **From Email:** `noreply@voicedesk.ai`  
✅ **Verification:** Disabled (can enable later)  

**Test SMTP:**
```bash
cd ~/admin-dashboard/backend
node -e "const nm=require('nodemailer');const t=nm.createTransport({host:'relay.sodahost.co.uk',port:26,secure:false});t.verify((e,s)=>console.log(e?'❌ '+e:'✅ Ready'));"
```

Expected: `✅ Ready`

---

## 📊 USEFUL COMMANDS

```bash
# View real-time logs
pm2 logs

# Check status
pm2 status

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# View last 50 log lines
pm2 logs --lines 50
```

---

## 🔐 SECURITY CHECKLIST

After deployment:

1. ✅ **Change admin password**
   ```bash
   # Login to dashboard
   # Go to settings (or use psql)
   psql -U voiceaiuser -d voice-ai
   UPDATE admin_users 
   SET password_hash = crypt('YourNewPassword', gen_salt('bf')) 
   WHERE username = 'admin';
   \q
   ```

2. ✅ **Configure firewall**
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 3000/tcp  # Frontend
   sudo ufw allow 5000/tcp  # Backend
   sudo ufw enable
   ```

3. ✅ **Monitor logs**
   ```bash
   pm2 logs
   ```

4. ✅ **Set up auto-start**
   ```bash
   pm2 startup
   # Run the command it gives you
   pm2 save
   ```

---

## 🐛 TROUBLESHOOTING

### **Services won't start?**
```bash
pm2 logs --lines 100
# Check for errors

# Restart
pm2 restart all
```

### **Can't access from browser?**
```bash
# Check firewall
sudo ufw status

# Open ports if needed
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
```

### **Database connection error?**
```bash
sudo systemctl status postgresql
psql -U voiceaiuser -d voice-ai -c "SELECT 1"
```

### **Port already in use?**
```bash
# Check what's using the port
sudo netstat -tulpn | grep 3000
sudo netstat -tulpn | grep 5000

# Kill if needed
pm2 delete all
```

---

## 📈 WHAT'S INCLUDED

✅ **Backend API** - Full REST API with authentication  
✅ **Frontend UI** - React dashboard  
✅ **Database** - PostgreSQL with all tables  
✅ **Email Service** - SodaHost SMTP relay  
✅ **Transcript Saving** - Automatic from Pipecat  
✅ **Authentication** - Login, signup, password reset  
✅ **Security** - JWT tokens, bcrypt hashing  

---

## 🎯 QUICK START

```bash
# 1. Deploy
cd ~/admin-dashboard
chmod +x DEPLOY_NOW.sh
./DEPLOY_NOW.sh

# 2. Open firewall
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp

# 3. Open browser
# Visit: http://195.34.79.69:3000
# Login: admin / admin123

# 4. Test
# Make a call to: +441135117691
# Check Transcripts page
```

---

## 📞 SUPPORT

**Check logs:**
```bash
pm2 logs voicedesk-admin-api --lines 50
pm2 logs voicedesk-admin-ui --lines 50
```

**Check database:**
```bash
psql -U voiceaiuser -d voice-ai
SELECT * FROM admin_users;
SELECT count(*) FROM call_transcripts;
\q
```

**Restart everything:**
```bash
pm2 restart all
```

---

## 🎉 YOU'RE READY!

Everything is configured and ready to deploy!

**Just run:**

```bash
cd ~/admin-dashboard
chmod +x DEPLOY_NOW.sh
./DEPLOY_NOW.sh
```

**Then open in your browser:**
```
http://195.34.79.69:3000
```

**Login and test!** 🚀

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] Run `./DEPLOY_NOW.sh`
- [ ] Services show as "online" in `pm2 status`
- [ ] Test health: `curl http://localhost:5000/health`
- [ ] Open firewall: `sudo ufw allow 3000/tcp && sudo ufw allow 5000/tcp`
- [ ] Open browser: `http://195.34.79.69:3000`
- [ ] Login with admin/admin123
- [ ] Dashboard loads successfully
- [ ] Make test call to +441135117691
- [ ] Check Transcripts page - see the call
- [ ] Change admin password
- [ ] ✅ **DONE!**

---

**Server:** ai-agent-platform (195.34.79.69)  
**Status:** ✅ READY TO DEPLOY  
**Time to deploy:** ~5 minutes  

**Deploy now!** 🎉

