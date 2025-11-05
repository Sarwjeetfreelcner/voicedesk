# Files to Upload to Server

## CRITICAL FILES (Must upload):

### Updated Source Files:
```
src/asterisk/asterisk.service.ts          ← Updated with snoop/recording methods
src/incoming-calls/incoming-calls.service.ts  ← Updated with audio streaming
```

### New Deployment Files:
```
deploy-with-streaming.sh                  ← Deployment script
AUDIO_STREAMING_IMPLEMENTATION.md         ← Documentation
DEPLOY_NOW.md                            ← Quick guide
```

## OPTIONAL FILES (Can skip):
```
src/incoming-calls/incoming-calls-streaming.service.ts  ← Alternative implementation (not used)
src/incoming-calls/audio-stream-bridge.service.ts       ← RTP bridge (not used)
deploy-to-server.ps1                                    ← Windows deployment script
```

## Quick Upload Commands:

### Option 1: Using deploy-to-server.ps1 (Automated)
```powershell
.\asterik-nest\deploy-to-server.ps1
```

### Option 2: Manual SCP from Windows
```powershell
# Upload critical source files
scp asterik-nest\src\asterisk\asterisk.service.ts nortel@ai-agent-platform:~/asterik-nest/src/asterisk/
scp asterik-nest\src\incoming-calls\incoming-calls.service.ts nortel@ai-agent-platform:~/asterik-nest/src/incoming-calls/

# Upload deployment script
scp asterik-nest\deploy-with-streaming.sh nortel@ai-agent-platform:~/asterik-nest/
scp asterik-nest\DEPLOY_NOW.md nortel@ai-agent-platform:~/asterik-nest/

# SSH to server and deploy
ssh nortel@ai-agent-platform
cd ~/asterik-nest
chmod +x deploy-with-streaming.sh
./deploy-with-streaming.sh
```

### Option 3: Upload entire src folder
```powershell
scp -r asterik-nest\src nortel@ai-agent-platform:~/asterik-nest/
```

