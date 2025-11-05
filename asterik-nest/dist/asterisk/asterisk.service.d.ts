export declare class AsteriskService {
    private readonly logger;
    private readonly ariUrl;
    private readonly ariAuth;
    constructor();
    private initializeAsterisk;
    makeCall(phoneNumber: string, context?: string): Promise<string>;
    hangupCall(channelId: string): Promise<void>;
    getChannelStatus(channelId: string): Promise<any>;
    answerCall(channelId: string): Promise<void>;
    playAudioFile(channelId: string, audioFile: string): Promise<void>;
    private playBuiltinSound;
    private playCustomAudio;
    createExternalMedia(app: string, externalHost: string, format?: string): Promise<any>;
    addChannelToBridge(bridgeId: string, channelId: string, role?: string): Promise<void>;
    createBridge(bridgeType?: string): Promise<any>;
    destroyBridge(bridgeId: string): Promise<void>;
    startRecording(channelId: string, name: string, format?: string): Promise<any>;
    stopRecording(recordingName: string): Promise<void>;
    createSnoopChannel(channelId: string, app: string, spy?: string, whisper?: string): Promise<any>;
}
