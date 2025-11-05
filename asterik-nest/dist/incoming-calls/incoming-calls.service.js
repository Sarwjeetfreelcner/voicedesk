"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IncomingCallsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomingCallsService = void 0;
const common_1 = require("@nestjs/common");
const tts_service_1 = require("../tts/tts.service");
const asterisk_service_1 = require("../asterisk/asterisk.service");
const ai_conversation_service_1 = require("../ai-conversation/ai-conversation.service");
const fs = require("fs");
const WebSocket = require("ws");
let IncomingCallsService = IncomingCallsService_1 = class IncomingCallsService {
    constructor(ttsService, asteriskService, aiConversationService) {
        this.ttsService = ttsService;
        this.asteriskService = asteriskService;
        this.aiConversationService = aiConversationService;
        this.logger = new common_1.Logger(IncomingCallsService_1.name);
    }
    async handleIncomingCall(callerNumber, channelId) {
        try {
            this.logger.log(`Handling incoming call from ${callerNumber} on channel ${channelId}`);
            await this.asteriskService.answerCall(channelId);
            this.logger.log('Call answered successfully');
            await this.sleep(1000);
            if (this.aiConversationService.isEnabled()) {
                this.logger.log('AI Conversation is enabled - attempting to connect to Pipecat Agent');
                const aiSuccess = await this.handleAiConversation(callerNumber, channelId);
                if (aiSuccess) {
                    this.logger.log('AI conversation completed successfully');
                    return;
                }
                else {
                    this.logger.warn('AI conversation failed - falling back to default audio');
                }
            }
            this.logger.log('Playing manual test audio file: intro_1760256231995_8k.wav');
            await this.asteriskService.playAudioFile(channelId, '/app/audio/intro_1760256231995_8k.wav');
            await this.sleep(10000);
            await this.asteriskService.hangupCall(channelId);
            this.logger.log('Call completed and hung up');
        }
        catch (error) {
            this.logger.error('Error handling incoming call:', error.message);
            try {
                await this.asteriskService.hangupCall(channelId);
            }
            catch (hangupError) {
                this.logger.error('Error hanging up call:', hangupError.message);
            }
        }
    }
    async handleAiConversation(callerNumber, channelId) {
        let ws = null;
        try {
            const callId = `call_${Date.now()}_${channelId}`;
            ws = await this.aiConversationService.startConversation(callId, callerNumber, channelId);
            if (!ws) {
                this.logger.warn('Failed to establish WebSocket connection to Pipecat');
                return false;
            }
            this.logger.log(`AI conversation started for call ${callId}`);
            const snoopChannel = await this.asteriskService.createSnoopChannel(channelId, 'voicedesk', 'both', 'none');
            this.logger.log(`Snoop channel created: ${snoopChannel.id}`);
            const recordingName = `snoop_${callId}`;
            await this.asteriskService.startRecording(snoopChannel.id, recordingName, 'sln');
            this.logger.log(`Started recording: ${recordingName}`);
            this.streamAudioToPipecat(ws, recordingName, channelId);
            this.aiConversationService.setupAudioListener(ws, async (audioBuffer) => {
                try {
                    const tempFile = `/tmp/pipecat_audio_${Date.now()}.wav`;
                    fs.writeFileSync(tempFile, audioBuffer);
                    this.logger.log(`Playing AI audio: ${tempFile}`);
                    await this.asteriskService.playAudioFile(channelId, tempFile);
                    setTimeout(() => {
                        try {
                            if (fs.existsSync(tempFile)) {
                                fs.unlinkSync(tempFile);
                            }
                        }
                        catch (cleanupError) {
                            this.logger.warn(`Could not clean up temp file: ${cleanupError.message}`);
                        }
                    }, 5000);
                }
                catch (error) {
                    this.logger.error(`Error playing audio from Pipecat: ${error.message}`);
                }
            });
            const cleanup = async () => {
                this.logger.log(`Cleaning up AI conversation for ${callId}`);
                if (ws.audioStreamInterval) {
                    clearInterval(ws.audioStreamInterval);
                }
                try {
                    await this.asteriskService.stopRecording(recordingName);
                }
                catch (e) { }
                try {
                    await this.asteriskService.hangupCall(snoopChannel.id);
                }
                catch (e) { }
                this.aiConversationService.endConversation(ws);
            };
            const monitorInterval = setInterval(async () => {
                try {
                    const status = await this.asteriskService.getChannelStatus(channelId);
                    if (!status || status.state === 'Down' || status.state === 'Hangup') {
                        this.logger.log(`Call ${callId} ended - stopping AI conversation`);
                        clearInterval(monitorInterval);
                        await cleanup();
                    }
                }
                catch (error) {
                    clearInterval(monitorInterval);
                    await cleanup();
                }
            }, 2000);
            setTimeout(async () => {
                this.logger.log(`Max call duration reached for ${callId}`);
                clearInterval(monitorInterval);
                await cleanup();
                this.asteriskService.hangupCall(channelId).catch(() => { });
            }, 10 * 60 * 1000);
            this.aiConversationService.monitorConnection(ws, callId, async () => {
                clearInterval(monitorInterval);
                await cleanup();
            });
            return true;
        }
        catch (error) {
            this.logger.error(`Error in AI conversation: ${error.message}`);
            if (ws) {
                this.aiConversationService.endConversation(ws);
            }
            return false;
        }
    }
    async playIntroMessage(callerNumber, channelId) {
        try {
            this.logger.log('Generating intro message...');
            const audioFilePath = await this.ttsService.createIntroAudio(callerNumber);
            if (audioFilePath && fs.existsSync(audioFilePath)) {
                this.logger.log(`TTS audio generated successfully: ${audioFilePath}`);
                await this.sleep(500);
                this.logger.log('Playing generated audio file');
                await this.asteriskService.playAudioFile(channelId, audioFilePath);
                setTimeout(() => {
                    try {
                        fs.unlinkSync(audioFilePath);
                        this.logger.log(`Cleaned up audio file: ${audioFilePath}`);
                    }
                    catch (cleanupError) {
                        this.logger.warn(`Could not clean up audio file: ${cleanupError.message}`);
                    }
                }, 5000);
            }
            else {
                this.logger.warn('Audio file not found, playing default beep');
                await this.playDefaultBeeps(channelId);
            }
        }
        catch (error) {
            this.logger.error('Error playing intro message:', error.message);
            await this.playDefaultBeeps(channelId);
        }
    }
    async playDefaultBeeps(channelId) {
        try {
            this.logger.log('Playing default beeps...');
            await this.asteriskService.playAudioFile(channelId, 'beep');
            await this.sleep(2000);
            await this.asteriskService.playAudioFile(channelId, 'beep');
            await this.sleep(1000);
            await this.asteriskService.playAudioFile(channelId, 'beep');
        }
        catch (error) {
            this.logger.error('Error playing default beeps:', error.message);
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    streamAudioToPipecat(ws, recordingName, channelId) {
        const recordingPath = `/var/spool/asterisk/recording/${recordingName}.sln`;
        let lastPosition = 0;
        let streamActive = true;
        this.logger.log(`Starting audio stream from ${recordingPath} to Pipecat`);
        const streamInterval = setInterval(() => {
            if (!streamActive || ws.readyState !== WebSocket.OPEN) {
                clearInterval(streamInterval);
                return;
            }
            try {
                if (!fs.existsSync(recordingPath)) {
                    return;
                }
                const stats = fs.statSync(recordingPath);
                const currentSize = stats.size;
                if (currentSize > lastPosition) {
                    const newDataSize = currentSize - lastPosition;
                    const buffer = Buffer.alloc(newDataSize);
                    const fd = fs.openSync(recordingPath, 'r');
                    fs.readSync(fd, buffer, 0, newDataSize, lastPosition);
                    fs.closeSync(fd);
                    this.aiConversationService.sendAudioToPipecat(ws, buffer, 8000);
                    this.logger.debug(`Streamed ${newDataSize} bytes of audio to Pipecat`);
                    lastPosition = currentSize;
                }
            }
            catch (error) {
                this.logger.error(`Error streaming audio to Pipecat: ${error.message}`);
            }
        }, 50);
        ws.audioStreamInterval = streamInterval;
        ws.on('close', () => {
            streamActive = false;
            clearInterval(streamInterval);
            this.logger.log('Audio streaming stopped (WebSocket closed)');
        });
    }
};
exports.IncomingCallsService = IncomingCallsService;
exports.IncomingCallsService = IncomingCallsService = IncomingCallsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tts_service_1.TtsService,
        asterisk_service_1.AsteriskService,
        ai_conversation_service_1.AiConversationService])
], IncomingCallsService);
//# sourceMappingURL=incoming-calls.service.js.map