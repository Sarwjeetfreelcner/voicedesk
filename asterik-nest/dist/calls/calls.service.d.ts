import { Repository } from "typeorm";
import { ScheduledCall } from "../entities/scheduled-call.entity";
import { AsteriskService } from "../asterisk/asterisk.service";
export declare class CallsService {
    private scheduledCallRepository;
    private asteriskService;
    private readonly logger;
    constructor(scheduledCallRepository: Repository<ScheduledCall>, asteriskService: AsteriskService);
    scheduleCall(phoneNumber: string, scheduledTime: Date, notes?: string): Promise<ScheduledCall>;
    getAllScheduledCalls(): Promise<ScheduledCall[]>;
    getScheduledCallById(id: number): Promise<ScheduledCall>;
    cancelCall(id: number): Promise<void>;
    updateCallStatus(id: number, status: ScheduledCall["status"], callId?: string, errorMessage?: string): Promise<void>;
    processScheduledCalls(): Promise<void>;
    private executeCall;
}
