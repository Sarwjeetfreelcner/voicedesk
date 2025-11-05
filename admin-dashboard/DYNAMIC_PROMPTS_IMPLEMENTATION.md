# 🎯 Dynamic Prompts & Greetings Implementation

## ✅ **What Was Changed**

The Pipecat AI agent now **dynamically fetches** active system prompts and greeting messages from the admin dashboard database **at the start of each call**, instead of using static environment variables.

---

## 🔍 **Previous Behavior (Before)**

❌ **STATIC**: Prompts and greetings were read from Docker environment variables

- Defined in `docker-compose.yml`
- Required **container restart** to apply changes
- Admin dashboard updates had **NO EFFECT** on bot behavior

```python
# OLD CODE (static)
system_prompt = os.getenv("SYSTEM_PROMPT", "default prompt...")
greeting = os.getenv("GREETING_MESSAGE", "Hello!")
```

---

## ✅ **New Behavior (After)**

✅ **DYNAMIC**: Prompts and greetings are fetched from database

- Admin dashboard changes **take effect immediately** on next call
- No container restart required
- Falls back to environment variables if database is unavailable

```python
# NEW CODE (dynamic)
def get_active_system_prompt():
    """Fetch active prompt from /api/prompts/active"""
    response = requests.get(f'{ADMIN_API_URL}/prompts/active')
    return response.json()['prompt']['prompt_text']

def get_active_greeting():
    """Fetch active greeting from /api/greetings/active"""
    response = requests.get(f'{ADMIN_API_URL}/greetings/active')
    return response.json()['greeting']['greeting_text']
```

---

## 🔧 **Changes Made to `bot_asterisk_fixed.py`**

### 1. Added Two New Functions

**`get_active_system_prompt()`**

- Fetches the active system prompt from `/api/prompts/active`
- Logs success/failure
- Falls back to `SYSTEM_PROMPT` environment variable if API fails

**`get_active_greeting()`**

- Fetches the active greeting from `/api/greetings/active`
- Logs success/failure
- Falls back to `GREETING_MESSAGE` environment variable if API fails

### 2. Updated `run_asterisk_bot()` Function

**Before:**

```python
system_prompt = os.getenv("SYSTEM_PROMPT", "default...")
```

**After:**

```python
system_prompt = get_active_system_prompt()  # Fetches from database!
```

### 3. Updated `on_client_connected()` Event Handler

**Before:**

```python
greeting = os.getenv("GREETING_MESSAGE", "Hello!")
```

**After:**

```python
greeting = get_active_greeting()  # Fetches from database!
```

---

## 📊 **How It Works**

```
┌─────────────────────┐
│  Admin Dashboard    │
│  (Update Prompt)    │
└──────────┬──────────┘
           │
           │ Saves to PostgreSQL
           ▼
┌─────────────────────┐
│  PostgreSQL DB      │
│  system_prompts     │
│  is_active = true   │
└──────────┬──────────┘
           │
           │ API: GET /api/prompts/active
           ▼
┌─────────────────────┐
│  Pipecat Agent      │
│  (New Call Starts)  │
│  ✅ Fetches Active  │
│  ✅ Uses in Bot     │
└─────────────────────┘
```

---

## 🚀 **How to Deploy**

### Option 1: Rebuild Container (Recommended)

```bash
cd ~/asterik-nest

# Rebuild pipecat-agent with updated code
docker-compose build pipecat-agent

# Restart the container
docker-compose --profile ai up -d pipecat-agent

# Verify it's running
docker logs pipecat-agent --tail 20
```

### Option 2: Copy Updated File (Faster)

```bash
# Copy updated bot file to container
docker cp ~/asterik-nest/../pipecat-agent/bot_asterisk_fixed.py pipecat-agent:/usr/src/app/

# Restart container to reload code
docker-compose --profile ai restart pipecat-agent

# Check logs
docker logs -f pipecat-agent
```

---

## ✅ **Testing the Integration**

### Step 1: Update Prompt in Dashboard

1. Go to **Admin Dashboard** → **Prompts**
2. Click **"New Prompt"**
3. Enter:
   - **Name:** `Test Dynamic Prompt`
   - **Prompt:** `You are a friendly assistant. Always start your responses with "Hello friend!"`
   - **Active:** ✅ (Check this box)
4. Click **Save**

### Step 2: Update Greeting in Dashboard

1. Go to **Admin Dashboard** → **Greetings**
2. Click **"New Greeting"**
3. Enter:
   - **Name:** `Test Dynamic Greeting`
   - **Greeting:** `Hi there! This is a test greeting from the database!`
   - **Active:** ✅ (Check this box)
4. Click **Save**

### Step 3: Make a Test Call

1. Call your Asterisk number
2. **Expected behavior:**
   - You should hear the **new greeting** you just created
   - The bot should respond according to the **new prompt** you created

### Step 4: Check Logs

```bash
docker logs pipecat-agent --tail 50 | grep -i "ADMIN DASHBOARD"
```

**Expected output:**

```
✅ [ADMIN DASHBOARD] Fetching active system prompt...
✅ [ADMIN DASHBOARD] Using active prompt from database
✅ [ADMIN DASHBOARD] Fetching active greeting...
✅ [ADMIN DASHBOARD] Using active greeting from database
```

---

## 🎯 **About the "New Prompt" and "New Greeting" Buttons**

### **Are They Necessary?**

**YES, they are necessary and useful!** Here's why:

#### Use Cases:

1. **A/B Testing Different Prompts**

   - Create multiple prompts
   - Switch between them to see which works better
   - Keep history of what worked

2. **Different Scenarios**

   - **Business Hours Prompt:** Formal, professional tone
   - **After Hours Prompt:** More relaxed, friendly tone
   - **Holiday Greeting:** Special seasonal message

3. **Backup Prompts**

   - Keep old prompts in case you want to revert
   - Don't have to remember what the old prompt was

4. **Multi-Language Support** (Future)

   - English prompt
   - Spanish prompt
   - French prompt
   - Just toggle which one is active

5. **Version Control**
   - Track changes over time
   - See who updated what and when
   - Roll back if needed

### **Suggested UI Improvement**

Instead of **"New Prompt"**, you could rename it to:

- ✅ **"Add Prompt Template"**
- ✅ **"Create Prompt Variant"**
- ✅ **"Add New Version"**

This makes it clearer that you're creating **multiple options** to switch between, not replacing the current one.

---

## 🔒 **Fallback Behavior**

If the admin dashboard is unavailable (e.g., server down, network issue):

- ✅ Bot will use **environment variables** from `docker-compose.yml`
- ✅ Call will still work (no crash)
- ⚠️ Warning logged: `"Using fallback prompt from environment variable"`

---

## 📝 **Summary**

| Feature               | Before                              | After                         |
| --------------------- | ----------------------------------- | ----------------------------- |
| **Prompt Source**     | Environment Variable                | Database (with fallback)      |
| **Greeting Source**   | Environment Variable                | Database (with fallback)      |
| **Update Method**     | Edit `docker-compose.yml` + restart | Update in dashboard (instant) |
| **Takes Effect**      | After container restart             | Next call (immediate)         |
| **Multiple Variants** | ❌ No                               | ✅ Yes (can create & switch)  |
| **History Tracking**  | ❌ No                               | ✅ Yes (stored in DB)         |
| **Fallback**          | N/A                                 | ✅ Yes (env vars)             |

---

## 🎉 **Benefits**

✅ **Instant Updates:** Change prompts without touching code or restarting containers
✅ **A/B Testing:** Create multiple prompts and switch between them
✅ **User-Friendly:** Non-technical users can update prompts via dashboard
✅ **Safe Fallback:** System still works if dashboard is down
✅ **Audit Trail:** Track who changed what and when
✅ **No Downtime:** Changes apply to new calls immediately

---

## 🛠️ **Files Modified**

1. **`pipecat-agent/bot_asterisk_fixed.py`**

   - Added `get_active_system_prompt()` function
   - Added `get_active_greeting()` function
   - Updated `run_asterisk_bot()` to use dynamic prompt
   - Updated `on_client_connected()` to use dynamic greeting

2. **`admin-dashboard/backend/server.js`** (Already existed)
   - `GET /api/prompts/active` - Returns active system prompt
   - `GET /api/greetings/active` - Returns active greeting message

---

## 🚀 **Ready to Deploy!**

Run these commands on your server:

```bash
cd ~/asterik-nest
docker-compose build pipecat-agent
docker-compose --profile ai up -d pipecat-agent
docker logs -f pipecat-agent
```

Then make a test call and verify the logs show:

```
✅ [ADMIN DASHBOARD] Using active prompt from database
✅ [ADMIN DASHBOARD] Using active greeting from database
```

🎉 **Done!**
