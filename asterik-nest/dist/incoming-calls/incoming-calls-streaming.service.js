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
var IncomingCallsStreamingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomingCallsStreamingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const asterisk_service_1 = require("../asterisk/asterisk.service");
const ai_conversation_service_1 = require("../ai-conversation/ai-conversation.service");
const fs = require("fs");
let IncomingCallsStreamingService = IncomingCallsStreamingService_1 = class IncomingCallsStreamingService {
    constructor(asteriskService, aiConversationService, configService) {
        this.asteriskService = asteriskService;
        this.aiConversationService = aiConversationService;
        this.configService = configService;
        this.logger = new common_1.Logger(IncomingCallsStreamingService_1.name);
    }
    async handleAiConversation(channelId, callerNumber, callId) {
        let bridge = null;
        let snoopChannel = null;
        let pipecatWs = null;
        let audioStreamInterval = null;
        try {
            this.logger.log(`Starting AI conversation with real-time streaming for call ${callId}`);
            bridge = await this.asteriskService.createBridge('mixing');
            this.logger.log(`Created bridge: ${bridge.id}`);
            await this.asteriskService.addChannelToBridge(bridge.id, channelId);
            this.logger.log(`Added channel ${channelId} to bridge ${bridge.id}`);
            pipecatWs = await this.aiConversationService.startConversation(callId, callerNumber, channelId);
            if (!pipecatWs) {
                throw new Error('Failed to connect to Pipecat Agent');
            }
            this.logger.log(`Connected to Pipecat Agent for call ${callId}`);
            const recordingName = `ai_call_${callId}`;
            await this.asteriskService.startRecording(channelId, recordingName, 'sln');
            this.setupPipecatAudioPlayback(pipecatWs, channelId);
            await this.streamAudioToPipecat(pipecatWs, recordingName, channelId);
            const monitorInterval = setInterval(async () => {
                try {
                    const status = await this.asteriskService.getChannelStatus(channelId);
                    if (!status || status.state === 'Down') {
                        this.logger.log(`Call ${callId} ended`);
                        clearInterval(monitorInterval);
                        await this.cleanup(channelId, bridge?.id, recordingName, pipecatWs);
                    }
                }
                catch (error) {
                    clearInterval(monitorInterval);
                    await this.cleanup(channelId, bridge?.id, recordingName, pipecatWs);
                }
            }, 2000);
            setTimeout(async () => {
                clearInterval(monitorInterval);
                await this.cleanup(channelId, bridge?.id, recordingName, pipecatWs);
            }, 30 * 60 * 1000);
            return true;
        }
        catch (error) {
            this.logger.error(`Error in AI conversation: ${error.message}`);
            await this.cleanup(channelId, bridge?.id, null, pipecatWs);
            return false;
        }
    }
    setupPipecatAudioPlayback(ws, channelId) {
        this.aiConversationService.setupAudioListener(ws, async (audioBuffer) => {
            try {
                const tempFile = `/tmp/pipecat_${Date.now()}.sln`;
                fs.writeFileSync(tempFile, audioBuffer);
                this.logger.debug(`Playing AI audio: ${audioBuffer.length} bytes`);
                await this.asteriskService.playAudioFile(channelId, tempFile);
                setTimeout(() => {
                    try {
                        if (fs.existsSync(tempFile))
                            fs.unlinkSync(tempFile);
                    }
                    catch (e) { }
                }, 3000);
            }
            catch (error) {
                this.logger.error(`Error playing Pipecat audio: ${error.message}`);
            }
        });
    }
    async streamAudioToPipecat(ws, recordingName, channelId) {
        const recordingPath = `/var/spool/asterisk/recording/${recordingName}.sln`;
        let lastPosition = 0;
        const streamInterval = setInterval(() => {
            try {
                if (!fs.existsSync(recordingPath)) {
                    return;
                }
                const stats = fs.statSync(recordingPath);
                const currentSize = stats.size;
                if (currentSize > lastPosition) {
                    const buffer = Buffer.alloc(currentSize - lastPosition);
                    const fd = fs.openSync(recordingPath, 'r');
                    fs.readSync(fd, buffer, 0, buffer.length, lastPosition);
                    fs.closeSync(fd);
                    this.aiConversationService.sendAudioToPipecat(ws, buffer, 8000);
                    lastPosition = currentSize;
                }
            }
            catch (error) {
                this.logger.error(`Error streaming audio to Pipecat: ${error.message}`);
            }
        }, 100);
        ws.streamInterval = streamInterval;
    }
    async cleanup(channelId, bridgeId, recordingName, pipecatWs) {
        this.logger.log(`Cleaning up resources for channel ${channelId}`);
        if (pipecatWs && pipecatWs.streamInterval) {
            clearInterval(pipecatWs.streamInterval);
        }
        if (recordingName) {
            try {
                await this.asteriskService.stopRecording(recordingName);
            }
            catch (e) {
                this.logger.warn(`Could not stop recording: ${e.message}`);
            }
        }
        if (pipecatWs) {
            this.aiConversationService.endConversation(pipecatWs);
        }
        if (bridgeId) {
            try {
                await this.asteriskService.destroyBridge(bridgeId);
            }
            catch (e) {
                this.logger.warn(`Could not destroy bridge: ${e.message}`);
            }
        }
        try {
            await this.asteriskService.hangupCall(channelId);
        }
        catch (e) {
        }
    }
};
exports.IncomingCallsStreamingService = IncomingCallsStreamingService;
exports.IncomingCallsStreamingService = IncomingCallsStreamingService = IncomingCallsStreamingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [asterisk_service_1.AsteriskService,
        ai_conversation_service_1.AiConversationService,
        config_1.ConfigService])
], IncomingCallsStreamingService);
//# sourceMappingURL=incoming-calls-streaming.service.js.map