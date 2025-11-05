# 🎯 Complete Admin Dashboard Setup Guide

## ✅ What's Included

I've created a **complete admin dashboard system** with:

### Backend (Node.js + Express + PostgreSQL)
- ✅ Secure JWT authentication
- ✅ RESTful API for all operations
- ✅ PostgreSQL database with proper schema
- ✅ Automatic database initialization
- ✅ Password hashing with bcrypt
- ✅ Complete CRUD operations for transcripts, prompts, and greetings

### Frontend (React)
- ✅ Modern responsive UI
- ✅ Admin authentication/login
- ✅ Dashboard with statistics
- ✅ Call transcripts viewer
- ✅ System prompts management
- ✅ Greeting messages management
- ✅ Protected routes
- ✅ Real-time updates

---

## 🚀 Quick Installation

### Option 1: Automated Installation (Recommended)

```bash
cd admin-dashboard
chmod +x install.sh
./install.sh
```

This will:
1. Install all backend dependencies
2. Install all frontend dependencies
3. Initialize the database
4. Create default admin user

### Option 2: Manual Installation

Follow the detailed steps in `QUICK_START.md`

---

## 📁 Project Structure

```
admin-dashboard/
├── README.md                    # Full documentation
├── QUICK_START.md              # 5-minute setup guide
├── COMPLETE_SETUP.md           # This file
├── FRONTEND_CODE.md            # All React component code
├── install.sh                  # Automated installation script
│
├── backend/
│   ├── server.js               # Express API server (700+ lines)
│   ├── package.json            # Dependencies
│   ├── config.env              # Environment configuration
│   └── scripts/
│       └── init-db.js          # Database initialization (200+ lines)
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js              # Main app with routing
        ├── App.css             # Styles
        ├── components/
        │   ├── Login.js        # Login page
        │   ├── Dashboard.js    # Dashboard with stats
        │   ├── Transcripts.js  # Transcripts list
        │   ├── TranscriptDetail.js  # Single transcript view
        │   ├── Prompts.js      # Prompts management
        │   └── Greetings.js    # Greetings management
        ├── services/
        │   └── api.js          # API client
        └── context/
            └── AuthContext.js  # Authentication context
```

---

## 🗄️ Database Schema

The system automatically creates these tables:

### 1. `admin_users`
Stores admin user credentials
- id, username, password_hash, email, created_at, last_login

### 2. `call_transcripts`
Stores call metadata
- id, call_id, caller_number, channel_id, start_time, end_time, duration_seconds, status

### 3. `call_messages`
Stores individual messages in conversations
- id, call_id, role, content, timestamp, sequence_number

### 4. `system_prompts`
Stores AI assistant system prompts
- id, prompt_name, prompt_text, is_active, created_at, updated_at, updated_by

### 5. `greeting_messages`
Stores greeting messages
- id, message_text, is_active, created_at, updated_at, updated_by

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Transcripts
- `GET /api/transcripts` - List all (paginated)
- `GET /api/transcripts/:callId` - Get single transcript
- `POST /api/transcripts` - Create/update transcript
- `DELETE /api/transcripts/:callId` - Delete transcript

### Prompts
- `GET /api/prompts` - List all prompts
- `GET /api/prompts/active` - Get active prompt
- `POST /api/prompts` - Create prompt
- `PUT /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt

### Greetings
- `GET /api/greetings` - List all greetings
- `GET /api/greetings/active` - Get active greeting
- `POST /api/greetings` - Create greeting
- `PUT /api/greetings/:id` - Update greeting
- `DELETE /api/greetings/:id` - Delete greeting

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

---

## 🔗 Integration with Pipecat

To automatically save call transcripts, add this to your `pipecat-agent`:

### 1. Add dependency
```bash
cd pipecat-agent
echo "requests" >> requirements.txt
```

### 2. Update `bot_asterisk_fixed.py`

Add import at top:
```python
import requests
```

Update the `on_client_disconnected` handler:
```python
@transport.event_handler("on_client_disconnected")
async def on_client_disconnected(transport, client):
    logger.info(f"📴 Client disconnected for call {call_id}")
    try:
        # Get transcript
        transcript_messages = messages
        
        # Save to admin dashboard API
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
                logger.error(f"❌ Failed to save transcript: HTTP {response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to save transcript: {e}")
        
        # Print transcript (existing code)
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

### 3. Rebuild Pipecat container
```bash
cd ~/asterik-nest
docker-compose --profile ai down
docker-compose --profile ai build --no-cache pipecat-agent
docker-compose --profile ai up -d
```

---

## 🎨 Frontend Features

### 1. Login Page
- Username/password authentication
- Form validation
- Error handling
- Remember me option

### 2. Dashboard
- Total calls counter
- Today's calls counter
- Average call duration
- Call status breakdown
- Quick navigation

### 3. Transcripts Page
- Paginated list of all calls
- Search functionality
- Filter by date/status
- Click to view full transcript
- Delete transcripts
- Real-time updates

### 4. Transcript Detail Page
- Full conversation history
- Caller information
- Call duration and timestamps
- Role-based message display (user/assistant/system)
- Export functionality (future)

### 5. Prompts Management
- Create new system prompts
- Edit existing prompts
- Activate/deactivate prompts
- Only one active prompt at a time
- Preview prompt text
- Delete inactive prompts

### 6. Greetings Management
- Create new greeting messages
- Edit greetings
- Activate/deactivate greetings
- Only one active greeting at a time
- Test greetings
- Delete inactive greetings

---

## 🔐 Security Features

- ✅ JWT token authentication (24h expiration)
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ Protected API routes (middleware)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Token expiration handling
- ✅ Secure password storage

---

## 🚀 Starting the Application

### Terminal 1: Backend
```bash
cd admin-dashboard/backend
npm start
```

**Expected output:**
```
🚀 VoiceDesk Admin Backend running on port 5000
📊 Environment: development
💾 Database: localhost:5432/voice-ai
```

### Terminal 2: Frontend
```bash
cd admin-dashboard/frontend
npm start
```

**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```

### Access the Dashboard
Open browser: `http://localhost:3000`

**Login credentials:**
- Username: `admin`
- Password: `admin123`

---

## 📊 Testing

### 1. Test Backend API
```bash
# Health check
curl http://localhost:5000/health

# Login (get token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Test Database
```bash
psql -U voiceaiuser -d voice-ai

# List tables
\dt

# View admin users
SELECT * FROM admin_users;

# View transcripts
SELECT * FROM call_transcripts;
```

### 3. Test Frontend
1. Open `http://localhost:3000`
2. Login with admin credentials
3. Navigate through all pages
4. Test CRUD operations

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill the process
kill -9 <PID>

# Check database connection
psql -U voiceaiuser -d voice-ai -c "SELECT 1"
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check credentials
psql -U voiceaiuser -d voice-ai

# If database doesn't exist, create it
sudo -u postgres psql
CREATE DATABASE "voice-ai";
CREATE USER voiceaiuser WITH PASSWORD 'P@ssw0rd12345';
GRANT ALL PRIVILEGES ON DATABASE "voice-ai" TO voiceaiuser;
\q
```

### "Cannot GET /api/..." errors
- Ensure backend is running on port 5000
- Check frontend proxy in `package.json`
- Verify API_BASE_URL in `frontend/src/services/api.js`

---

## 📝 Next Steps

1. **Change default password** (IMPORTANT!)
2. **Test the system** with a real call
3. **Customize prompts** for your use case
4. **Configure production deployment** (if needed)
5. **Set up automatic backups** for the database

---

## 🎯 Production Deployment

### Environment Setup
1. Update `backend/.env`:
   - Change `JWT_SECRET` to a strong random string
   - Set `NODE_ENV=production`
   - Update database credentials if needed

2. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```

3. Deploy backend with PM2:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start server.js --name voicedesk-api
   pm2 save
   pm2 startup
   ```

4. Serve frontend with nginx or deploy to Vercel/Netlify

---

## 📞 Support

If you encounter issues:

1. **Check the logs**
   - Backend: Terminal output
   - Frontend: Browser console (F12)
   
2. **Verify all services are running**
   - PostgreSQL
   - Backend API (port 5000)
   - Frontend dev server (port 3000)

3. **Check environment variables**
   - Database credentials
   - JWT secret
   - API URLs

4. **Review this documentation**
   - README.md - Full documentation
   - QUICK_START.md - Quick setup guide
   - FRONTEND_CODE.md - React components

---

## 🎉 You're All Set!

The complete admin dashboard system is now ready to use:

- ✅ Secure authentication system
- ✅ Full transcript management
- ✅ System prompts configuration
- ✅ Greeting messages management
- ✅ Dashboard analytics
- ✅ Modern responsive UI
- ✅ Production-ready API

**Start managing your VoiceDesk AI system now!** 🚀

For detailed React component code, see `FRONTEND_CODE.md`.

