# 🚀 START HERE - Complete Setup in 5 Minutes

## Welcome! Let's get your admin dashboard running!

---

## 📋 What You're About to Deploy

A complete admin dashboard that automatically saves every call transcript from your Asterisk + Pipecat AI system.

**Features:**
- ✅ Automatic transcript saving
- ✅ View all calls and conversations
- ✅ Manage AI prompts
- ✅ Manage greeting messages
- ✅ Modern responsive UI
- ✅ Secure authentication

---

## ⚡ FASTEST WAY (ONE COMMAND)

### **Step 1: Open PowerShell**
```powershell
cd C:\Users\Acer\Desktop\asterisk-project\admin-dashboard
```

### **Step 2: Run Deployment Script**
```powershell
.\deploy-complete.ps1
```

### **Step 3: Wait ~5 minutes**
The script will:
- ✅ Install all dependencies
- ✅ Setup database
- ✅ Rebuild Docker containers
- ✅ Ask if you want to start services

### **Step 4: Say "Y" when prompted**
The script will start backend and frontend for you!

### **Step 5: Open Browser**
- URL: http://localhost:3000
- Login: `admin` / `admin123`

### **Step 6: Make a test call!**
- Call: +441135117691
- Talk to the AI
- Hang up
- Refresh Transcripts page
- See your conversation! 🎉

---

## 🎯 THAT'S IT! YOU'RE DONE!

But if you want to do it manually, continue reading...

---

## 🔧 MANUAL SETUP (If Preferred)

### **Step 1: Install Dependencies**

```powershell
cd C:\Users\Acer\Desktop\asterisk-project\admin-dashboard
.\install.ps1
```

**Time:** ~2 minutes  
**What it does:** Installs Node.js packages, creates database tables

---

### **Step 2: Start Backend**

**Open Terminal 1:**
```powershell
cd C:\Users\Acer\Desktop\asterisk-project\admin-dashboard\backend
npm start
```

**Wait for:** `🚀 VoiceDesk Admin Backend running on port 5000`

---

### **Step 3: Start Frontend**

**Open Terminal 2:**
```powershell
cd C:\Users\Acer\Desktop\asterisk-project\admin-dashboard\frontend
npm start
```

**Wait for:** Browser opens automatically to http://localhost:3000

---

### **Step 4: Rebuild Pipecat**

**Open Terminal 3:**
```powershell
cd C:\Users\Acer\Desktop\asterisk-project\asterik-nest
docker-compose --profile ai down
docker-compose --profile ai build --no-cache pipecat-agent
docker-compose --profile ai up -d
```

**Time:** ~2 minutes  
**What it does:** Rebuilds Pipecat with transcript-saving integration

---

### **Step 5: Login**

1. Browser should open to http://localhost:3000
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. You'll see the Dashboard!

---

### **Step 6: Test It!**

1. **Make a call:** Dial +441135117691
2. **Talk to AI:** Have a conversation
3. **Hang up**
4. **Go to Transcripts page** in dashboard
5. **Click "View Transcript"**
6. **See your conversation!** 🎉

---

## ✅ SUCCESS CHECKLIST

Check these to make sure everything is working:

- [ ] Backend running (Terminal 1 shows port 5000)
- [ ] Frontend running (Browser opened to localhost:3000)
- [ ] Docker containers running (Pipecat, Asterisk, Voicedesk)
- [ ] Can login to dashboard
- [ ] Dashboard shows (may show 0 calls initially)
- [ ] Made test call
- [ ] AI responded
- [ ] Call ended successfully
- [ ] Transcript visible in dashboard

---

## 🐛 Quick Troubleshooting

### **Problem: Backend won't start**
```powershell
cd backend
npm install
npm start
```

### **Problem: Frontend won't start**
```powershell
cd frontend
npm install
npm start
```

### **Problem: Database error**
```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# If stopped, start it
Start-Service postgresql-x64-XX
```

### **Problem: No transcripts showing up**
```powershell
# Check Pipecat logs
cd ..\asterik-nest
docker-compose logs pipecat-agent | Select-String "ADMIN DASHBOARD"

# Should see: "✅ [ADMIN DASHBOARD] Transcript saved"
```

---

## 📚 More Information

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **QUICK_REFERENCE.md** | Quick commands | Keep open while working |
| **INTEGRATION_COMPLETE.md** | How it works | Understand the system |
| **SYSTEM_ARCHITECTURE.md** | Architecture | Learn the structure |
| **README.md** | Full documentation | Deep dive |

---

## 🎯 What You Can Do Now

### **1. View Calls**
- Go to Transcripts page
- See list of all calls
- Click any call to view full conversation

### **2. Manage Prompts**
- Go to Prompts page
- Create new AI prompts
- Edit existing prompts
- Activate your favorite prompt

### **3. Manage Greetings**
- Go to Greetings page
- Create new greetings
- Edit existing greetings
- Activate your favorite greeting

### **4. Monitor System**
- Dashboard shows statistics
- See call counts
- View recent activity

---

## 🔐 Security (Important!)

### **BEFORE PRODUCTION:**

1. **Change admin password:**
   ```sql
   psql -U voiceaiuser -d voice-ai
   UPDATE admin_users 
   SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf')) 
   WHERE username = 'admin';
   ```

2. **Update JWT secret:**
   Edit `backend/config.env`:
   ```env
   JWT_SECRET=create-a-very-long-random-string-here
   ```

3. **Enable HTTPS** (for production)

---

## 🎉 Congratulations!

You now have a complete admin dashboard integrated with your AI phone system!

**Every call will automatically:**
- Be saved to the database
- Have its full transcript recorded
- Be viewable in the dashboard
- Include all conversation details

---

## 🚀 Quick Start Commands

**Start everything:**
```powershell
# Terminal 1
cd admin-dashboard\backend
npm start

# Terminal 2 (new window)
cd admin-dashboard\frontend
npm start

# Terminal 3 (new window)
cd asterik-nest
docker-compose --profile ai up -d
```

**Stop everything:**
```powershell
# Ctrl+C in Terminal 1 (backend)
# Ctrl+C in Terminal 2 (frontend)

# Terminal 3
cd asterik-nest
docker-compose --profile ai down
```

**View logs:**
```powershell
docker-compose logs -f pipecat-agent
```

---

## 💡 Pro Tips

1. **Keep QUICK_REFERENCE.md open** for quick commands
2. **Check logs** if something doesn't work
3. **Make test calls** to verify integration
4. **Change password** immediately after first login
5. **Backup database** regularly (PostgreSQL)

---

## 📞 Need Help?

1. **Check logs:**
   ```powershell
   docker-compose logs -f
   ```

2. **Read documentation:**
   - `QUICK_REFERENCE.md` - Quick commands
   - `INTEGRATION_COMPLETE.md` - How it works
   - `README.md` - Full documentation

3. **Test API:**
   ```powershell
   curl http://localhost:5000/health
   ```

4. **Check database:**
   ```powershell
   psql -U voiceaiuser -d voice-ai
   SELECT * FROM call_transcripts;
   ```

---

## 🎊 You're Ready!

**Everything is set up and ready to use!**

**Next steps:**
1. ✅ Make test calls
2. ✅ View transcripts
3. ✅ Customize prompts
4. ✅ Change greeting messages
5. ✅ Monitor your system

---

**Happy calling! 🎉**

---

*Quick Start Guide v1.0*  
*Last Updated: October 30, 2025*  
*Status: Complete ✅*

---

## 🔗 Quick Links

- **Dashboard:** http://localhost:3000
- **API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **Documentation:** `admin-dashboard/` folder

---

**Remember:** The script `deploy-complete.ps1` does all of this automatically! 🚀

