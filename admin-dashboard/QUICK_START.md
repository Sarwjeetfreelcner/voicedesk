# 🚀 Quick Start Guide - VoiceDesk Admin Dashboard

Get the admin dashboard running in 5 minutes!

## ⚡ Quick Setup (Copy & Paste)

### Step 1: Setup Backend

```bash
cd admin-dashboard/backend

# Copy environment file
cp config.env .env

# Install dependencies
npm install

# Initialize database
npm run init-db

# Start server
npm start
```

**Expected Output:**
```
🚀 VoiceDesk Admin Backend running on port 5000
📊 Environment: development
💾 Database: localhost:5432/voice-ai
```

### Step 2: Setup Frontend (New Terminal)

```bash
cd admin-dashboard/frontend

# Install dependencies
npm install

# Start React app
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view voicedesk-admin-frontend in the browser.
Local: http://localhost:3000
```

### Step 3: Login

1. Open browser: `http://localhost:3000`
2. Login with default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

---

## 📋 What You Get

✅ **Dashboard** - View call statistics and metrics  
✅ **Transcripts** - Browse all call transcripts  
✅ **System Prompts** - Manage AI assistant prompts  
✅ **Greeting Messages** - Customize greetings  

---

## 🔗 Integrate with Pipecat

Add this code to save transcripts automatically:

### File: `pipecat-agent/requirements.txt`
Add: `requests`

### File: `pipecat-agent/bot_asterisk_fixed.py`

Find the `on_client_disconnected` handler and add:

```python
@transport.event_handler("on_client_disconnected")
async def on_client_disconnected(transport, client):
    logger.info(f"📴 Client disconnected for call {call_id}")
    try:
        # Get transcript
        transcript_messages = messages  # The messages list from context
        
        # Save to admin dashboard
        import requests
        try:
            response = requests.post(
                'http://localhost:5000/api/transcripts',
                json={
                    'call_id': call_id,
                    'caller_number': caller_number,
                    'messages': transcript_messages,
                    'status': 'completed'
                },
                timeout=5
            )
            if response.status_code == 200:
                logger.info(f"✅ Transcript saved to admin dashboard")
            else:
                logger.error(f"❌ Failed to save transcript: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ Failed to save transcript: {e}")
        
        # Save transcript locally (existing code)
        transcript = {
            "call_id": call_id,
            "caller_number": caller_number,
            "messages": transcript_messages
        }
        logger.info(f"📋 Transcript: {json.dumps(transcript, indent=2)}")
        
        await task.queue_frames([EndFrame()])
    except Exception as e:
        logger.error(f"Error in on_client_disconnected: {e}")
        logger.exception("Full traceback:")
```

### Rebuild Pipecat Container

```bash
cd ~/asterik-nest
docker-compose --profile ai down
docker-compose --profile ai build --no-cache pipecat-agent
docker-compose --profile ai up -d
```

---

## 🎯 Test It!

1. **Make a test call** to your Asterisk system
2. **Have a conversation** with the AI
3. **Hang up**
4. **Refresh admin dashboard** - Your transcript should appear!

---

## 🔐 Change Default Password

After first login, change the password:

```sql
-- Connect to database
psql -U voiceaiuser -d voice-ai

-- Update admin password (replace 'yournewpassword')
UPDATE admin_users 
SET password_hash = crypt('yournewpassword', gen_salt('bf')) 
WHERE username = 'admin';
```

Or create a new admin user:

```sql
INSERT INTO admin_users (username, password_hash, email)
VALUES (
  'yourusername',
  crypt('yourpassword', gen_salt('bf')),
  'your@email.com'
);
```

---

## 📱 Access Admin Dashboard

- **Local**: `http://localhost:3000`
- **Remote**: `http://your-server-ip:3000`

---

## 🐛 Common Issues

### "Database connection failed"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check if database exists
psql -U voiceaiuser -l | grep voice-ai
```

### "Port 5000 already in use"
```bash
# Find process using port 5000
lsof -i :5000

# Kill it
kill -9 <PID>
```

### "Cannot connect to backend"
- Check backend is running: `http://localhost:5000/health`
- Check frontend proxy in `frontend/package.json`:
  ```json
  "proxy": "http://localhost:5000"
  ```

---

## 🎨 Customize

### Change Backend Port
Edit `backend/config.env`:
```env
PORT=8080
```

### Change Frontend Port
```bash
PORT=3001 npm start
```

### Use Different Database
Edit `backend/config.env`:
```env
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=your-database
```

---

## 📊 Features Overview

### Dashboard
- Total calls count
- Today's calls
- Average call duration
- Call status breakdown

### Transcripts
- View all call transcripts
- Search by call ID or caller
- Filter by date
- View full conversation
- Delete transcripts

### System Prompts
- Create multiple prompts
- Edit existing prompts
- Set active prompt (used by AI)
- Prompt history

### Greeting Messages
- Create multiple greetings
- Edit greetings
- Set active greeting (used in calls)
- Greeting history

---

## 🚀 Production Deployment

### Quick Production Setup

1. **Update environment variables**:
```bash
# backend/.env
NODE_ENV=production
JWT_SECRET=your-super-secret-random-string-here
```

2. **Build frontend**:
```bash
cd frontend
npm run build
```

3. **Serve with PM2**:
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name voicedesk-api

# Serve frontend (option 1: simple)
pm2 serve frontend/build 3000 --name voicedesk-admin

# Save PM2 config
pm2 save
pm2 startup
```

---

## 📞 Need Help?

1. Check `README.md` for detailed documentation
2. Review error logs:
   - Backend: Terminal output
   - Frontend: Browser console (F12)
3. Verify database connection
4. Check all environment variables

---

**You're all set! 🎉**

Login and start managing your VoiceDesk AI system!

