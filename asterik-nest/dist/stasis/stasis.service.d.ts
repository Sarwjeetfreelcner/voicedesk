import { IncomingCallsService } from '../incoming-calls/incoming-calls.service';
export declare class StasisService {
    private readonly incomingCallsService;
    private readonly logger;
    constructor(incomingCallsService: IncomingCallsService);
    handleStasisEvent(event: any): Promise<void>;
    private handleStasisStart;
    private handleStasisEnd;
    private handleChannelDestroyed;
}
