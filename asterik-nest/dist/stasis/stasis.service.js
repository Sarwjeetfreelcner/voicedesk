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
var StasisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StasisService = void 0;
const common_1 = require("@nestjs/common");
const incoming_calls_service_1 = require("../incoming-calls/incoming-calls.service");
let StasisService = StasisService_1 = class StasisService {
    constructor(incomingCallsService) {
        this.incomingCallsService = incomingCallsService;
        this.logger = new common_1.Logger(StasisService_1.name);
    }
    async handleStasisEvent(event) {
        this.logger.log(`Received Stasis event: ${event.type}`);
        switch (event.type) {
            case 'StasisStart':
                await this.handleStasisStart(event);
                break;
            case 'StasisEnd':
                await this.handleStasisEnd(event);
                break;
            case 'ChannelDestroyed':
                await this.handleChannelDestroyed(event);
                break;
            default:
                this.logger.debug(`Unhandled event type: ${event.type}`);
        }
    }
    async handleStasisStart(event) {
        try {
            const channelId = event.channel.id;
            const callerNumber = event.args?.[0] || 'Unknown';
            this.logger.log(`StasisStart - Channel: ${channelId}, Caller: ${callerNumber}`);
            await this.incomingCallsService.handleIncomingCall(callerNumber, channelId);
        }
        catch (error) {
            this.logger.error('Error handling StasisStart:', error.message);
        }
    }
    async handleStasisEnd(event) {
        this.logger.log(`StasisEnd - Channel: ${event.channel?.id}`);
    }
    async handleChannelDestroyed(event) {
        this.logger.log(`ChannelDestroyed - Channel: ${event.channel?.id}`);
    }
};
exports.StasisService = StasisService;
exports.StasisService = StasisService = StasisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [incoming_calls_service_1.IncomingCallsService])
], StasisService);
//# sourceMappingURL=stasis.service.js.map