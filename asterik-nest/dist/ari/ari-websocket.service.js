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
var AriWebSocketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AriWebSocketService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stasis_service_1 = require("../stasis/stasis.service");
const WebSocket = require("ws");
let AriWebSocketService = AriWebSocketService_1 = class AriWebSocketService {
    constructor(configService, stasisService) {
        this.configService = configService;
        this.stasisService = stasisService;
        this.logger = new common_1.Logger(AriWebSocketService_1.name);
        this.ws = null;
        this.reconnectInterval = null;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        this.ariUrl = this.configService.get('ASTERISK_ARI_URL', 'http://localhost:8088');
        this.username = this.configService.get('ASTERISK_ARI_USERNAME', 'voicedesk');
        this.password = this.configService.get('ASTERISK_ARI_PASSWORD', 'voicedesk');
    }
    async onModuleInit() {
        this.logger.log('ARI WebSocket service initializing...');
        setTimeout(() => {
            this.connect();
        }, 5000);
    }
    async connect() {
        try {
            const apiKey = Buffer.from(`${this.username}:${this.password}`).toString('base64');
            const wsUrl = this.ariUrl.replace('http', 'ws') + `/ari/events?api_key=${apiKey}&app=voicedesk`;
            this.logger.log(`Connecting to ARI WebSocket: ${wsUrl}`);
            this.logger.log(`API Key: ${apiKey}`);
            this.ws = new WebSocket(wsUrl, {
                headers: {
                    'Authorization': `Basic ${apiKey}`
                }
            });
            this.ws.on('open', () => {
                this.logger.log('ARI WebSocket connected successfully');
                this.reconnectAttempts = 0;
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            });
            this.ws.on('message', (data) => {
                try {
                    const event = JSON.parse(data.toString());
                    this.handleAriEvent(event);
                }
                catch (error) {
                    this.logger.error('Error parsing ARI event:', error.message);
                }
            });
            this.ws.on('error', (error) => {
                this.logger.error('ARI WebSocket error:', error.message);
            });
            this.ws.on('close', (code, reason) => {
                this.logger.warn(`ARI WebSocket closed: ${code} - ${reason}`);
                this.scheduleReconnect();
            });
        }
        catch (error) {
            this.logger.error('Failed to connect to ARI WebSocket:', error.message);
            this.scheduleReconnect();
        }
    }
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error('Max reconnection attempts reached. Stopping reconnection attempts.');
            return;
        }
        if (this.reconnectInterval) {
            return;
        }
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;
        this.logger.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
        this.reconnectInterval = setTimeout(() => {
            this.reconnectInterval = null;
            this.connect();
        }, delay);
    }
    async handleAriEvent(event) {
        try {
            if (event.application !== 'voicedesk') {
                return;
            }
            this.logger.debug(`Handling ARI event: ${event.type}`);
            if (event.type.startsWith('Stasis')) {
                await this.stasisService.handleStasisEvent(event);
            }
        }
        catch (error) {
            this.logger.error('Error handling ARI event:', error.message);
        }
    }
    async disconnect() {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
};
exports.AriWebSocketService = AriWebSocketService;
exports.AriWebSocketService = AriWebSocketService = AriWebSocketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        stasis_service_1.StasisService])
], AriWebSocketService);
//# sourceMappingURL=ari-websocket.service.js.map