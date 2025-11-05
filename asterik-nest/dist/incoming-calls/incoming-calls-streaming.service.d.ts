import { ConfigService } from '@nestjs/config';
import { AsteriskService } from '../asterisk/asterisk.service';
import { AiConversationService } from '../ai-conversation/ai-conversation.service';
export declare class IncomingCallsStreamingService {
    private asteriskService;
    private aiConversationService;
    private configService;
    private readonly logger;
    constructor(asteriskService: AsteriskService, aiConversationService: AiConversationService, configService: ConfigService);
    handleAiConversation(channelId: string, callerNumber: string, callId: string): Promise<boolean>;
    private setupPipecatAudioPlayback;
    private streamAudioToPipecat;
    private cleanup;
}
