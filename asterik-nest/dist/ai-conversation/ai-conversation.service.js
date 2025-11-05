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
var AiConversationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiConversationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const WebSocket = require("ws");
let AiConversationService = AiConversationService_1 = class AiConversationService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AiConversationService_1.name);
        this.pipecatUrl = this.configService.get('PIPECAT_AGENT_URL', 'ws://pipecat-agent:8080');
        this.enabled = this.configService.get('ENABLE_AI_CONVERSATION', 'false') === 'true';
        if (this.enabled) {
            this.logger.log('AI Conversation Service ENABLED - will connect to Pipecat Agent');
        }
        else {
            this.logger.log('AI Conversation Service DISABLED - using fallback audio');
        }
    }
    isEnabled() {
        return this.enabled;
    }
    async startConversation(callId, callerNumber, channelId) {
        if (!this.enabled) {
            this.logger.log('AI conversation disabled, skipping');
            return null;
        }
        try {
            const wsUrl = `${this.pipecatUrl}/ws/asterisk`;
            this.logger.log(`Connecting to Pipecat Agent: ${wsUrl} for call ${callId}`);
            const ws = new WebSocket(wsUrl);
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.logger.error('Pipecat connection timeout');
                    ws.close();
                    reject(new Error('Connection timeout'));
                }, 10000);
                ws.on('open', () => {
                    clearTimeout(timeout);
                    this.logger.log(`Connected to Pipecat Agent for call ${callId}`);
                    const initialData = {
                        call_id: callId,
                        caller_number: callerNumber,
                        channel_id: channelId,
                        timestamp: new Date().toISOString()
                    };
                    ws.send(JSON.stringify(initialData));
                    this.logger.log(`Sent initial data to Pipecat: ${JSON.stringify(initialData)}`);
                    resolve(ws);
                });
                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    this.logger.error(`Pipecat WebSocket error: ${error.message}`);
                    reject(error);
                });
                ws.on('close', (code, reason) => {
                    this.logger.log(`Pipecat WebSocket closed: ${code} - ${reason}`);
                });
            });
        }
        catch (error) {
            this.logger.error(`Failed to connect to Pipecat Agent: ${error.message}`);
            return null;
        }
    }
    async sendAudioToPipecat(ws, audioData, sampleRate = 8000) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            this.logger.warn('WebSocket not open, cannot send audio');
            return;
        }
        try {
            const audioMessage = {
                type: 'audio',
                audio: audioData.toString('base64'),
                sample_rate: sampleRate,
                num_channels: 1,
                timestamp: new Date().toISOString()
            };
            ws.send(JSON.stringify(audioMessage));
            this.logger.debug(`Sent audio data to Pipecat: ${audioData.length} bytes`);
        }
        catch (error) {
            this.logger.error(`Failed to send audio to Pipecat: ${error.message}`);
        }
    }
    setupAudioListener(ws, onAudio) {
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'audio' && message.audio) {
                    const audioBuffer = Buffer.from(message.audio, 'base64');
                    this.logger.debug(`Received audio from Pipecat: ${audioBuffer.length} bytes`);
                    onAudio(audioBuffer);
                }
                else if (message.type === 'event') {
                    this.logger.log(`Pipecat event: ${message.event}`);
                }
            }
            catch (error) {
                this.logger.error(`Error processing Pipecat message: ${error.message}`);
            }
        });
    }
    endConversation(ws) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            this.logger.log('Ending AI conversation');
            try {
                ws.send(JSON.stringify({ type: 'end_call' }));
                ws.close();
            }
            catch (error) {
                this.logger.error(`Error closing WebSocket: ${error.message}`);
            }
        }
    }
    monitorConnection(ws, callId, onDisconnect) {
        ws.on('close', () => {
            this.logger.log(`WebSocket closed for call ${callId}`);
            onDisconnect();
        });
        ws.on('error', (error) => {
            this.logger.error(`WebSocket error for call ${callId}: ${error.message}`);
            onDisconnect();
        });
        const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
            }
            else {
                clearInterval(heartbeat);
            }
        }, 30000);
    }
};
exports.AiConversationService = AiConversationService;
exports.AiConversationService = AiConversationService = AiConversationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiConversationService);
//# sourceMappingURL=ai-conversation.service.js.map