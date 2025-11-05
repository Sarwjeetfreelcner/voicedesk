import { AsteriskService } from '../asterisk/asterisk.service';
import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
export declare class AudioStreamBridgeService extends EventEmitter {
    private asteriskService;
    private readonly logger;
    private bridges;
    constructor(asteriskService: AsteriskService);
    createBridge(callId: string, channelId: string, pipecatWs: WebSocket): Promise<number>;
    destroyBridge(callId: string): Promise<void>;
    private bindSocket;
    private sendAudioToPipecat;
    private sendAudioToAsterisk;
    private createRtpPacket;
}
