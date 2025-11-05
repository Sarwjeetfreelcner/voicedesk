import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StasisService } from '../stasis/stasis.service';
export declare class AriWebSocketService implements OnModuleInit {
    private readonly configService;
    private readonly stasisService;
    private readonly logger;
    private ws;
    private reconnectInterval;
    private readonly maxReconnectAttempts;
    private reconnectAttempts;
    private readonly ariUrl;
    private readonly username;
    private readonly password;
    constructor(configService: ConfigService, stasisService: StasisService);
    onModuleInit(): Promise<void>;
    private connect;
    private scheduleReconnect;
    private handleAriEvent;
    disconnect(): Promise<void>;
}
