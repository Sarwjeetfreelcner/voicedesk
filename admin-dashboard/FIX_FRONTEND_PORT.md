# 🔧 FIX FRONTEND PORT ISSUE

## ❌ Problem

The frontend is starting on a random port instead of port 3000. The `serve` command needs proper configuration.

## ✅ Solution

Run these commands on your server:

```bash
# Stop the incorrectly configured frontend
pm2 delete voicedesk-admin-ui

# Start frontend with correct configuration
cd ~/admin-dashboard/frontend
pm2 start serve --name "voicedesk-admin-ui" -- -s build -p 3000

# Save PM2 config
pm2 save

# Check status
pm2 status
```

## 🎯 Explanation

The issue was using `-l 3000` (lowercase L) instead of `-p 3000`:
- `-l 3000` = logs parameter (wrong)
- `-p 3000` = port parameter (correct!)
- `-s` = serve single page app
- `-n` = don't copy to clipboard

## ✅ Verify

After running the commands:

```bash
# Check if it's running on port 3000
pm2 logs voicedesk-admin-ui --lines 5
```

Should see:
```
INFO  Accepting connections at http://localhost:3000
```

## 🌐 Test in Browser

Open: `http://195.34.79.69:3000`

Should now work!

## 🔥 Alternative: Use Simpler Command

If the above doesn't work, use this simpler approach:

```bash
# Stop frontend
pm2 delete voicedesk-admin-ui

# Go to frontend directory
cd ~/admin-dashboard/frontend

# Start with npx serve (simpler)
pm2 start npx --name "voicedesk-admin-ui" -- serve -s build -p 3000

# Save config
pm2 save

# Check logs
pm2 logs voicedesk-admin-ui
```

## 📊 Full Status Check

```bash
# See all processes
pm2 status

# View backend logs
pm2 logs voicedesk-admin-api --lines 20

# View frontend logs
pm2 logs voicedesk-admin-ui --lines 20
```

## ✅ Expected Output

```
┌────┬────────────────────────┬─────────┬──────────┐
│ id │ name                   │ status  │ port     │
├────┼────────────────────────┼─────────┼──────────┤
│ 0  │ voicedesk-admin-api    │ online  │ 5000     │
│ 1  │ voicedesk-admin-ui     │ online  │ 3000     │
└────┴────────────────────────┴─────────┴──────────┘
```

Logs should show:
```
INFO  Accepting connections at http://localhost:3000
```



