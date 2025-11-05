import { TtsService } from '../tts/tts.service';
import { AsteriskService } from '../asterisk/asterisk.service';
import { AiConversationService } from '../ai-conversation/ai-conversation.service';
export declare class IncomingCallsService {
    private readonly ttsService;
    private readonly asteriskService;
    private readonly aiConversationService;
    private readonly logger;
    constructor(ttsService: TtsService, asteriskService: AsteriskService, aiConversationService: AiConversationService);
    handleIncomingCall(callerNumber: string, channelId: string): Promise<void>;
    private handleAiConversation;
    private playIntroMessage;
    private playDefaultBeeps;
    private sleep;
    private streamAudioToPipecat;
}
