import { ConfigService } from '@nestjs/config';
export declare class TtsService {
    private configService;
    private readonly logger;
    private readonly elevenLabsApiKey;
    private readonly openaiApiKey;
    private readonly audioDir;
    constructor(configService: ConfigService);
    generateSpeech(text: string, voiceId?: string): Promise<string>;
    generateSpeechOpenAI(text: string, voice?: string): Promise<string>;
    generateIntroMessage(callerNumber?: string): Promise<string>;
    private getFallbackIntroMessage;
    createIntroAudio(callerNumber?: string): Promise<string>;
    getDefaultIntroMessage(): string;
}
