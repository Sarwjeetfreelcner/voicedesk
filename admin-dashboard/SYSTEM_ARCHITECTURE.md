# 🏗️ VoiceDesk AI System Architecture

## Complete System with Admin Dashboard Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE SYSTEM OVERVIEW                        │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  User calls  │
                              │ +4411351176  │
                              │     91       │
                              └──────┬───────┘
                                     │
                                     ↓
┌────────────────────────────────────────────────────────────────────────┐
│                         ASTERISK (Docker)                              │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  extensions.conf:                                                 │ │
│  │  [from-trunk]                                                     │ │
│  │  exten => 01135117691,1,NoOp(Incoming call)                      │ │
│  │  exten => 01135117691,n,Answer()                                 │ │
│  │  exten => 01135117691,n,Stasis(voicedesk,${CALLERID(num)})      │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Ports: 5060/udp (SIP), 8088 (ARI), 10000-10010/udp (RTP)             │
└────────────────────────────┬───────────────────────────────────────────┘
                             │ ARI WebSocket
                             │ ws://asterisk:8088/ari/events
                             ↓
┌────────────────────────────────────────────────────────────────────────┐
│                    VOICEDESK (NestJS - Docker)                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  IncomingCallsService:                                            │ │
│  │  1. Answer call                                                   │ │
│  │  2. Connect to Pipecat via WebSocket                             │ │
│  │  3. Create External Media channel                                │ │
│  │  4. Bridge RTP audio                                             │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  RtpAudioBridgeService:                                           │ │
│  │  - Receives RTP from Asterisk (μ-law, 8kHz)                      │ │
│  │  - Converts to 16-bit PCM                                        │ │
│  │  - Sends to Pipecat via WebSocket                                │ │
│  │  - Receives audio from Pipecat                                   │ │
│  │  - Converts to μ-law                                             │ │
│  │  - Sends RTP to Asterisk                                         │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Port: 3000, Dynamic RTP ports                                         │
└────────────────────┬─────────────────────────────────────┬─────────────┘
                     │ WebSocket                           │ RTP Audio
                     │ ws://pipecat-agent:8080/ws/asterisk │
                     ↓                                     ↓
┌────────────────────────────────────────────────────────────────────────┐
│                 PIPECAT AGENT (Python/FastAPI - Docker)                │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  bot_asterisk_fixed.py:                                           │ │
│  │                                                                    │ │
│  │  📞 on_client_connected:                                          │ │
│  │     ├── POST /api/transcripts (status: 'active')    ← NEW!       │ │
│  │     ├── Play greeting message                                    │ │
│  │     └── Start conversation                                       │ │
│  │                                                                    │ │
│  │  🎤 Audio Pipeline:                                               │ │
│  │     ├── Audio Input → Deepgram STT → Text                        │ │
│  │     ├── Text → TranscriptionAggregator (custom)                  │ │
│  │     ├── Complete Text → OpenAI GPT-4 → Response                  │ │
│  │     └── Response → ElevenLabs TTS → Audio Output                 │ │
│  │                                                                    │ │
│  │  📴 on_client_disconnected:                                       │ │
│  │     ├── Collect all messages from context.messages               │ │
│  │     ├── POST /api/transcripts (full transcript)     ← NEW!       │ │
│  │     └── End session                                              │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Port: 8080                                                            │
│  APIs: OpenAI, Deepgram, ElevenLabs                                    │
└───────────────────────────────┬────────────────────────────────────────┘
                                │ HTTP POST
                                │ http://host.docker.internal:5000/api
                                ↓
┌────────────────────────────────────────────────────────────────────────┐
│               ADMIN DASHBOARD BACKEND (Node.js/Express)                │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  server.js:                                                       │ │
│  │                                                                    │ │
│  │  🔐 Authentication:                                               │ │
│  │     POST /api/login     - JWT login                              │ │
│  │     POST /api/logout    - Logout                                 │ │
│  │                                                                    │ │
│  │  📋 Transcripts:                                                  │ │
│  │     GET  /api/transcripts       - List all calls                 │ │
│  │     GET  /api/transcripts/:id   - Get specific transcript        │ │
│  │     POST /api/transcripts       - Create/update transcript       │ │
│  │                                                                    │ │
│  │  📝 Prompts:                                                      │ │
│  │     GET    /api/prompts         - List prompts                   │ │
│  │     POST   /api/prompts         - Create prompt                  │ │
│  │     PUT    /api/prompts/:id     - Update prompt                  │ │
│  │     DELETE /api/prompts/:id     - Delete prompt                  │ │
│  │     POST   /api/prompts/:id/activate - Activate prompt           │ │
│  │                                                                    │ │
│  │  💬 Greetings:                                                    │ │
│  │     GET    /api/greetings       - List greetings                 │ │
│  │     POST   /api/greetings       - Create greeting                │ │
│  │     PUT    /api/greetings/:id   - Update greeting                │ │
│  │     DELETE /api/greetings/:id   - Delete greeting                │ │
│  │     POST   /api/greetings/:id/activate - Activate greeting       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Port: 5000                                                            │
└───────────────────────────────┬────────────────────────────────────────┘
                                │ SQL Queries
                                ↓
┌────────────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                                │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Tables:                                                          │ │
│  │                                                                    │ │
│  │  📊 call_transcripts:                                             │ │
│  │     - id (PRIMARY KEY)                                           │ │
│  │     - call_id (UNIQUE)                                           │ │
│  │     - caller_number                                              │ │
│  │     - channel_id                                                 │ │
│  │     - status (active/completed)                                  │ │
│  │     - messages (JSONB) ← Full conversation                       │ │
│  │     - created_at                                                 │ │
│  │     - completed_at                                               │ │
│  │                                                                    │ │
│  │  👤 admin_users:                                                  │ │
│  │     - id, username, password_hash (bcrypt)                       │ │
│  │                                                                    │ │
│  │  📝 system_prompts:                                               │ │
│  │     - id, name, prompt_text, is_active                           │ │
│  │                                                                    │ │
│  │  💬 greeting_messages:                                            │ │
│  │     - id, name, message_text, is_active                          │ │
│  │                                                                    │ │
│  │  📈 call_analytics (future):                                      │ │
│  │     - Statistics and metrics                                     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Host: localhost:5432                                                  │
│  Database: voice-ai                                                    │
│  User: voiceaiuser                                                     │
└───────────────────────────────┬────────────────────────────────────────┘
                                │ REST API
                                │ http://localhost:5000/api
                                ↓
┌────────────────────────────────────────────────────────────────────────┐
│               ADMIN DASHBOARD FRONTEND (React)                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  React App Structure:                                             │ │
│  │                                                                    │ │
│  │  🏠 App.js - Main router:                                         │ │
│  │     ├── /login        → Login.js                                 │ │
│  │     ├── /dashboard    → Dashboard.js (protected)                 │ │
│  │     ├── /transcripts  → Transcripts.js (protected)               │ │
│  │     │   └── /transcripts/:id → TranscriptDetail.js              │ │
│  │     ├── /prompts      → Prompts.js (protected)                   │ │
│  │     └── /greetings    → Greetings.js (protected)                 │ │
│  │                                                                    │ │
│  │  🔐 AuthContext.js - Authentication state                         │ │
│  │  🌐 api.js - API client with JWT interceptor                      │ │
│  │  🎨 App.css - Responsive modern styling                           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Port: 3000                                                            │
│  Access: http://localhost:3000                                         │
└────────────────────────────────────────────────────────────────────────┘
                                ↓
                         ┌──────────────┐
                         │  Admin User  │
                         │  👤 Browser  │
                         └──────────────┘
```

---

## 🔄 Call Flow with Transcript Saving

### **Detailed Step-by-Step:**

```
1️⃣  USER CALLS
    ├── Phone: Dials +441135117691
    └── SIP INVITE → Asterisk

2️⃣  ASTERISK RECEIVES CALL
    ├── Matches extension 01135117691
    ├── Executes: Answer()
    └── Executes: Stasis(voicedesk, caller_number)

3️⃣  VOICEDESK HANDLES STASIS
    ├── Receives StasisStart event via ARI WebSocket
    ├── Answers call (if not already answered)
    └── Initiates AI conversation flow

4️⃣  VOICEDESK CONNECTS TO PIPECAT
    ├── Opens WebSocket: ws://pipecat-agent:8080/ws/asterisk
    ├── Sends call metadata:
    │   {
    │     "call_id": "call_1761224755317_asterisk-1761224752.0",
    │     "caller_number": "00917651985130",
    │     "channel_id": "asterisk-1761224752.0"
    │   }
    └── Connection established

5️⃣  VOICEDESK CREATES RTP BRIDGE
    ├── Creates UDP socket on random port (e.g., 22325)
    ├── Binds socket to voicedesk-app:22325
    └── Ready to bridge audio

6️⃣  VOICEDESK CREATES EXTERNAL MEDIA
    ├── POST to Asterisk ARI: /channels/externalMedia
    │   {
    │     "app": "voicedesk",
    │     "external_host": "voicedesk-app:22325",
    │     "format": "ulaw"
    │   }
    ├── Asterisk creates UnicastRTP channel
    └── Channel ID: asterisk-1761224755.1

7️⃣  VOICEDESK BRIDGES CHANNELS
    ├── Creates Asterisk mixing bridge
    ├── Adds caller channel (asterisk-1761224752.0)
    ├── Adds External Media channel (asterisk-1761224755.1)
    └── Audio path established:
        User ↔ Asterisk ↔ RTP Bridge ↔ Pipecat

8️⃣  PIPECAT: on_client_connected EVENT
    ├── Logs: "🎤 Client connected"
    │
    ├── ✅ NEW: Save call start to admin dashboard
    │   └── POST http://host.docker.internal:5000/api/transcripts
    │       {
    │         "call_id": "call_1761224755317_asterisk-1761224752.0",
    │         "status": "active"
    │       }
    │   ↓
    │   Admin Dashboard Backend:
    │   ├── Receives request
    │   ├── Inserts into call_transcripts table:
    │   │   INSERT INTO call_transcripts (call_id, status, created_at)
    │   │   VALUES ('call_...', 'active', NOW())
    │   └── Returns: {"success": true, "transcriptId": 1}
    │   ↓
    │   Admin Dashboard UI:
    │   └── Shows call as "Active" (if page refreshed)
    │
    ├── Gets greeting message from env
    └── Queues greeting: TextFrame("Hello! How can I help you?")

9️⃣  AI GREETING SENT
    ├── TextFrame → TTS Service (ElevenLabs)
    ├── ElevenLabs generates audio
    ├── Audio → Pipecat transport → WebSocket
    ├── WebSocket → Voicedesk RTP Bridge
    ├── RTP Bridge converts to μ-law
    ├── Sends RTP packets to Asterisk
    └── User hears: "Hello! How can I help you?"

🔟 USER SPEAKS
    ├── User microphone → Phone
    ├── Phone → SIP/RTP → Asterisk
    ├── Asterisk → External Media → RTP packets (μ-law, 8kHz)
    ├── RTP Bridge receives packets
    ├── Converts μ-law → 16-bit PCM
    ├── Sends via WebSocket to Pipecat
    └── Pipecat receives AudioRawFrame

1️⃣1️⃣ SPEECH-TO-TEXT
    ├── AudioRawFrame → Deepgram STT Service
    ├── Deepgram transcribes (may send fragments)
    ├── Fragments → TranscriptionAggregator (custom)
    ├── Aggregator buffers for 2 seconds
    ├── Sends complete sentence: TranscriptionFrame
    └── Context updated: messages.append({"role": "user", "content": "..."})

1️⃣2️⃣ LLM PROCESSING
    ├── TranscriptionFrame → OpenAI LLM Service
    ├── OpenAI GPT-4 generates response
    ├── Uses system prompt from env
    └── Returns: "I'd be happy to help! What do you need?"

1️⃣3️⃣ TEXT-TO-SPEECH
    ├── LLM Response → ElevenLabs TTS
    ├── ElevenLabs generates audio
    ├── Audio → Transport → WebSocket → RTP Bridge
    ├── Converts to μ-law → RTP → Asterisk
    └── User hears AI response

1️⃣4️⃣ CONVERSATION CONTINUES
    ├── Steps 10-13 repeat for each user message
    ├── All messages stored in context.messages:
    │   [
    │     {"role": "assistant", "content": "Hello! ..."},
    │     {"role": "user", "content": "I need help"},
    │     {"role": "assistant", "content": "I'd be happy..."},
    │     {"role": "user", "content": "My password"},
    │     ...
    │   ]
    └── Conversation flows naturally

1️⃣5️⃣ CALL ENDS (User hangs up)
    ├── User presses hang up
    ├── SIP BYE → Asterisk
    ├── Asterisk closes External Media channel
    ├── WebSocket disconnects
    └── Pipecat triggers: on_client_disconnected event

1️⃣6️⃣ PIPECAT: on_client_disconnected EVENT
    ├── Logs: "📴 Client disconnected"
    │
    ├── Collects messages from context:
    │   transcript_messages = context.messages
    │
    ├── Logs final transcript to console
    │
    ├── ✅ NEW: Save full transcript to admin dashboard
    │   └── POST http://host.docker.internal:5000/api/transcripts
    │       {
    │         "call_id": "call_1761224755317_asterisk-1761224752.0",
    │         "caller_number": "00917651985130",
    │         "channel_id": "asterisk-1761224752.0",
    │         "status": "completed",
    │         "messages": [
    │           {"role": "assistant", "content": "Hello! How can I help you?"},
    │           {"role": "user", "content": "I need help with my password"},
    │           {"role": "assistant", "content": "I'd be happy to help..."},
    │           ...
    │         ]
    │       }
    │   ↓
    │   Admin Dashboard Backend:
    │   ├── Receives request
    │   ├── Updates call_transcripts table:
    │   │   UPDATE call_transcripts
    │   │   SET status = 'completed',
    │   │       messages = '[...]'::jsonb,
    │   │       completed_at = NOW()
    │   │   WHERE call_id = 'call_...'
    │   └── Returns: {"success": true, "transcriptId": 1}
    │   ↓
    │   Admin Dashboard UI:
    │   ├── Refreshed page shows call as "Completed"
    │   ├── Click "View Transcript" shows full conversation
    │   └── All messages displayed with formatting
    │
    └── Queues EndFrame() to end pipeline

1️⃣7️⃣ CLEANUP
    ├── Voicedesk destroys RTP bridge
    ├── Voicedesk hangs up External Media channel
    ├── Voicedesk destroys Asterisk bridge
    ├── Voicedesk hangs up caller channel
    └── Call complete

1️⃣8️⃣ ADMIN VIEWS TRANSCRIPT
    ├── Admin opens: http://localhost:3000/transcripts
    ├── Sees list of all calls
    ├── Clicks on call to view details
    └── Full conversation displayed:
        ┌────────────────────────────────────┐
        │ Call ID: call_176122...            │
        │ Caller: 00917651985130             │
        │ Duration: 2m 15s                   │
        │ Status: Completed                  │
        ├────────────────────────────────────┤
        │ 🤖 AI: Hello! How can I help you?  │
        │ 👤 User: I need help with my pass  │
        │ 🤖 AI: I'd be happy to help with  │
        │      your password. What specific  │
        │      issue are you having?         │
        │ 👤 User: I forgot it                │
        │ 🤖 AI: I can help you reset it... │
        └────────────────────────────────────┘
```

---

## 🔐 Security Flow

```
1. Admin Login
   ├── User enters credentials
   ├── Frontend: POST /api/login
   ├── Backend: Verify bcrypt password hash
   ├── Backend: Generate JWT token
   ├── Frontend: Store token in localStorage
   └── Frontend: Add token to all API requests

2. Protected API Requests
   ├── Frontend: Add header "Authorization: Bearer <token>"
   ├── Backend: Verify JWT signature
   ├── Backend: Check token expiration
   ├── If valid → Process request
   └── If invalid → Return 401 Unauthorized

3. Logout
   ├── Frontend: Remove token from localStorage
   ├── Frontend: Clear auth context
   └── Redirect to login page
```

---

## 📊 Data Storage

### **Transcript Storage (PostgreSQL):**

```sql
-- Example record
INSERT INTO call_transcripts (
  call_id,
  caller_number,
  channel_id,
  status,
  messages,
  created_at,
  completed_at
) VALUES (
  'call_1761224755317_asterisk-1761224752.0',
  '00917651985130',
  'asterisk-1761224752.0',
  'completed',
  '[
    {"role": "assistant", "content": "Hello! How can I help you?"},
    {"role": "user", "content": "I need help with my password"},
    {"role": "assistant", "content": "I would be happy to help..."}
  ]'::jsonb,
  '2025-10-30 13:05:55',
  '2025-10-30 13:08:10'
);
```

### **Query Examples:**

```sql
-- Get all calls today
SELECT * FROM call_transcripts
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Search by caller number
SELECT * FROM call_transcripts
WHERE caller_number LIKE '%7651985130%';

-- Get conversation messages
SELECT 
  call_id,
  caller_number,
  jsonb_array_length(messages) as message_count,
  messages
FROM call_transcripts
WHERE call_id = 'call_1761224755317_asterisk-1761224752.0';

-- Get average call duration
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM call_transcripts
WHERE status = 'completed';
```

---

## 🎯 Key Integration Points

| Component | Connection | Protocol | Purpose |
|-----------|-----------|----------|---------|
| Asterisk → Voicedesk | ARI WebSocket | WS | Event notifications |
| Voicedesk → Asterisk | ARI REST API | HTTP | Control channels |
| Voicedesk → Pipecat | Custom WebSocket | WS | Audio + metadata |
| Asterisk ↔ Voicedesk | RTP | UDP | Audio streaming |
| **Pipecat → Admin Dashboard** | **REST API** | **HTTP** | **Save transcripts** |
| Frontend → Backend | REST API | HTTP | Data operations |
| Backend → Database | SQL | TCP | Data persistence |

---

## 🚀 Deployment Architecture

```
Production Deployment:

┌─────────────────────────────────────────────┐
│             Cloud Server / VPS              │
│  ┌────────────────────────────────────────┐ │
│  │  Docker Compose                        │ │
│  │  ├── Asterisk container                │ │
│  │  ├── Voicedesk container               │ │
│  │  └── Pipecat container                 │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │  Admin Dashboard                       │ │
│  │  ├── Backend (PM2)                     │ │
│  │  └── Frontend (Nginx)                  │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │  PostgreSQL Database                   │ │
│  │  (or managed DB service)               │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

**Total System Components:** 7  
**Total Integration Points:** 7  
**Total Lines of Code:** ~7,000+  
**Status:** ✅ COMPLETE & READY  

---

*This architecture document provides a complete visual representation of how all components work together!*

