import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';
export declare class AiConversationService {
    private configService;
    private readonly logger;
    private readonly pipecatUrl;
    private readonly enabled;
    constructor(configService: ConfigService);
    isEnabled(): boolean;
    startConversation(callId: string, callerNumber: string, channelId: string): Promise<WebSocket | null>;
    sendAudioToPipecat(ws: WebSocket, audioData: Buffer, sampleRate?: number): Promise<void>;
    setupAudioListener(ws: WebSocket, onAudio: (audioBuffer: Buffer) => void): void;
    endConversation(ws: WebSocket | null): void;
    monitorConnection(ws: WebSocket, callId: string, onDisconnect: () => void): void;
}
