# VoiceDesk AI - Admin Dashboard

Complete admin dashboard for managing VoiceDesk AI calls, transcripts, and system prompts.

## 🚀 Features

- ✅ **Admin Authentication** - Secure login with JWT tokens
- ✅ **Call Transcripts** - View all call transcripts with full conversation history
- ✅ **System Prompts** - Create, update, and manage AI assistant prompts
- ✅ **Greeting Messages** - Customize greeting messages
- ✅ **Dashboard Statistics** - View call analytics and metrics
- ✅ **Real-time Updates** - Auto-refresh transcript data
- ✅ **Responsive Design** - Works on desktop and mobile

## 📁 Project Structure

```
admin-dashboard/
├── backend/
│   ├── server.js           # Express API server
│   ├── package.json
│   ├── config.env          # Environment configuration
│   └── scripts/
│       └── init-db.js      # Database initialization
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js
        ├── App.css
        ├── components/
        │   ├── Login.js
        │   ├── Dashboard.js
        │   ├── Transcripts.js
        │   ├── TranscriptDetail.js
        │   ├── Prompts.js
        │   └── Greetings.js
        ├── services/
        │   └── api.js
        └── context/
            └── AuthContext.js
```

## 🔧 Setup Instructions

### 1. Database Setup

The system uses PostgreSQL with the following credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=voiceaiuser
DB_PASSWORD=P@ssw0rd12345
DB_NAME=voice-ai
```

### 2. Backend Setup

```bash
cd admin-dashboard/backend

# Copy environment file
cp config.env .env

# Install dependencies
npm install

# Initialize database (creates tables and default admin user)
npm run init-db

# Start server
npm start
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the default password after first login!

### 3. Frontend Setup

```bash
cd admin-dashboard/frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will automatically proxy API requests to `http://localhost:5000`.

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/verify` - Verify JWT token

### Call Transcripts
- `GET /api/transcripts` - Get all transcripts (paginated)
- `GET /api/transcripts/:callId` - Get single transcript with messages
- `POST /api/transcripts` - Create/update transcript
- `DELETE /api/transcripts/:callId` - Delete transcript

### System Prompts
- `GET /api/prompts` - Get all prompts
- `GET /api/prompts/active` - Get active prompt
- `POST /api/prompts` - Create new prompt
- `PUT /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt

### Greeting Messages
- `GET /api/greetings` - Get all greetings
- `GET /api/greetings/active` - Get active greeting
- `POST /api/greetings` - Create new greeting
- `PUT /api/greetings/:id` - Update greeting
- `DELETE /api/greetings/:id` - Delete greeting

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🔗 Integration with Pipecat Agent

To integrate transcript saving with your Pipecat agent, add this to `bot_asterisk_fixed.py`:

```python
import requests

# In the on_client_disconnected handler:
@transport.event_handler("on_client_disconnected")
async def on_client_disconnected(transport, client):
    logger.info(f"📴 Client disconnected for call {call_id}")
    try:
        # Get transcript
        transcript_messages = context.messages if hasattr(context, 'messages') else []
        
        # Save to admin dashboard
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
            logger.info(f"✅ Transcript saved to admin dashboard")
        except Exception as e:
            logger.error(f"❌ Failed to save transcript: {e}")
        
        await task.queue_frames([EndFrame()])
    except Exception as e:
        logger.error(f"Error in on_client_disconnected: {e}")
```

## 🎨 Frontend Pages

### 1. Login Page
- Secure authentication with JWT
- Remember credentials option
- Error handling

### 2. Dashboard
- Total calls count
- Calls today
- Average call duration
- Quick stats

### 3. Transcripts List
- Paginated list of all calls
- Search and filter
- Click to view full transcript

### 4. Transcript Detail
- Full conversation history
- Caller information
- Call duration
- Export option

### 5. System Prompts
- Create new prompts
- Edit existing prompts
- Set active prompt
- Preview prompt text

### 6. Greeting Messages
- Manage greeting messages
- Set active greeting
- Test greetings

## 🔐 Security

- JWT token authentication
- Bcrypt password hashing
- SQL injection prevention with parameterized queries
- CORS configuration
- Input validation

## 📊 Database Schema

### admin_users
```sql
id SERIAL PRIMARY KEY
username VARCHAR(50) UNIQUE
password_hash VARCHAR(255)
email VARCHAR(100)
created_at TIMESTAMP
last_login TIMESTAMP
```

### call_transcripts
```sql
id SERIAL PRIMARY KEY
call_id VARCHAR(100) UNIQUE
caller_number VARCHAR(50)
channel_id VARCHAR(100)
start_time TIMESTAMP
end_time TIMESTAMP
duration_seconds INTEGER
status VARCHAR(20)
```

### call_messages
```sql
id SERIAL PRIMARY KEY
call_id VARCHAR(100) FK
role VARCHAR(20)
content TEXT
sequence_number INTEGER
timestamp TIMESTAMP
```

### system_prompts
```sql
id SERIAL PRIMARY KEY
prompt_name VARCHAR(100)
prompt_text TEXT
is_active BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
updated_by INTEGER FK
```

### greeting_messages
```sql
id SERIAL PRIMARY KEY
message_text TEXT
is_active BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
updated_by INTEGER FK
```

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Change `JWT_SECRET` to a strong random string
3. Update database credentials
4. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name voicedesk-api
   ```

### Frontend
1. Build for production:
   ```bash
   npm run build
   ```
2. Serve with nginx or deploy to Vercel/Netlify
3. Update API_BASE_URL in `src/services/api.js`

## 📝 Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=voiceaiuser
DB_PASSWORD=P@ssw0rd12345
DB_NAME=voice-ai
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `config.env`
- Ensure database exists: `psql -U voiceaiuser -d voice-ai`

### Backend Won't Start
- Check port 5000 is not in use: `lsof -i :5000`
- Install dependencies: `npm install`
- Check logs for errors

### Frontend Won't Start
- Check port 3000 is not in use
- Clear node_modules: `rm -rf node_modules && npm install`
- Check proxy configuration in `package.json`

## 📞 Support

For issues or questions:
1. Check this README
2. Review error logs
3. Check database connectivity
4. Verify environment variables

## 🔄 Updates

To update the system:
1. Pull latest code
2. Run `npm install` in both backend and frontend
3. Run database migrations if needed
4. Restart servers

---

**Built with ❤️ for VoiceDesk AI**

