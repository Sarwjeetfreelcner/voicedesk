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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CallsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const scheduled_call_entity_1 = require("../entities/scheduled-call.entity");
const asterisk_service_1 = require("../asterisk/asterisk.service");
let CallsService = CallsService_1 = class CallsService {
    constructor(scheduledCallRepository, asteriskService) {
        this.scheduledCallRepository = scheduledCallRepository;
        this.asteriskService = asteriskService;
        this.logger = new common_1.Logger(CallsService_1.name);
    }
    async scheduleCall(phoneNumber, scheduledTime, notes) {
        const scheduledCall = this.scheduledCallRepository.create({
            phoneNumber,
            scheduledTime,
            notes,
            status: "pending",
        });
        return await this.scheduledCallRepository.save(scheduledCall);
    }
    async getAllScheduledCalls() {
        return await this.scheduledCallRepository.find({
            order: { scheduledTime: "ASC" },
        });
    }
    async getScheduledCallById(id) {
        return await this.scheduledCallRepository.findOne({ where: { id } });
    }
    async cancelCall(id) {
        const call = await this.scheduledCallRepository.findOne({ where: { id } });
        if (call && call.status === "pending") {
            call.status = "cancelled";
            await this.scheduledCallRepository.save(call);
        }
    }
    async updateCallStatus(id, status, callId, errorMessage) {
        const call = await this.scheduledCallRepository.findOne({ where: { id } });
        if (call) {
            call.status = status;
            if (callId)
                call.callId = callId;
            if (errorMessage)
                call.errorMessage = errorMessage;
            await this.scheduledCallRepository.save(call);
        }
    }
    async processScheduledCalls() {
        const now = new Date();
        const pendingCalls = await this.scheduledCallRepository.find({
            where: {
                status: "pending",
            },
        });
        for (const call of pendingCalls) {
            if (call.scheduledTime <= now) {
                await this.executeCall(call);
            }
        }
    }
    async executeCall(call) {
        try {
            this.logger.log(`Executing scheduled call to ${call.phoneNumber}`);
            await this.updateCallStatus(call.id, "in_progress");
            const callId = await this.asteriskService.makeCall(call.phoneNumber);
            await this.updateCallStatus(call.id, "in_progress", callId);
            setTimeout(async () => {
                try {
                    await this.asteriskService.hangupCall(callId);
                    await this.updateCallStatus(call.id, "completed");
                    this.logger.log(`Call completed: ${call.phoneNumber}`);
                }
                catch (error) {
                    this.logger.error(`Error ending call ${callId}`, error);
                    await this.updateCallStatus(call.id, "failed", undefined, error.message);
                }
            }, 30000);
        }
        catch (error) {
            this.logger.error(`Failed to execute call to ${call.phoneNumber}`, error);
            await this.updateCallStatus(call.id, "failed", undefined, error.message);
        }
    }
};
exports.CallsService = CallsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CallsService.prototype, "processScheduledCalls", null);
exports.CallsService = CallsService = CallsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(scheduled_call_entity_1.ScheduledCall)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        asterisk_service_1.AsteriskService])
], CallsService);
//# sourceMappingURL=calls.service.js.map