import { CallsService } from "./calls.service";
import { ScheduledCall } from "../entities/scheduled-call.entity";
export declare class ScheduleCallDto {
    phoneNumber: string;
    scheduledTime: string;
    notes?: string;
}
export declare class CallsController {
    private readonly callsService;
    constructor(callsService: CallsService);
    scheduleCall(scheduleCallDto: ScheduleCallDto): Promise<ScheduledCall>;
    getAllCalls(): Promise<ScheduledCall[]>;
    getCallById(id: number): Promise<ScheduledCall>;
    cancelCall(id: number): Promise<{
        message: string;
    }>;
}
