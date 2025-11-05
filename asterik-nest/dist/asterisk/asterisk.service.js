"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AsteriskService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsteriskService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let AsteriskService = AsteriskService_1 = class AsteriskService {
    constructor() {
        this.logger = new common_1.Logger(AsteriskService_1.name);
        this.ariUrl = process.env.ASTERISK_ARI_URL || 'http://localhost:8088';
        this.ariAuth = Buffer.from(`${process.env.ASTERISK_ARI_USERNAME || 'asterisk'}:${process.env.ASTERISK_ARI_PASSWORD || 'asterisk'}`).toString('base64');
        this.initializeAsterisk();
    }
    async initializeAsterisk() {
        this.logger.log('AsteriskService initialized - ARI connection will be tested on first call');
    }
    async makeCall(phoneNumber, context = 'from-internal') {
        try {
            const sipTrunk = process.env.SIP_TRUNK || 'voip-provider';
            const channelId = `voicedesk-${Date.now()}`;
            const response = await axios_1.default.post(`${this.ariUrl}/ari/channels`, {
                endpoint: `Local/s@${context};1(${phoneNumber})`,
                app: 'voicedesk',
                appArgs: 'dialed',
                callerId: process.env.CALLER_ID || 'VoiceDesk',
                context: context,
                extension: 's',
                priority: 1,
                timeout: 30,
                variables: {
                    'SIP_HEADER_X-Call-ID': channelId,
                    'CALLERID(name)': process.env.CALLER_ID_NAME || 'VoiceDesk',
                    'CALLERID(num)': process.env.CALLER_ID_NUMBER || '1000',
                    'SIPTRUNK': sipTrunk
                }
            }, {
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`,
                    'Content-Type': 'application/json'
                }
            });
            const returnedChannelId = response.data.id;
            this.logger.log(`Call initiated via SIP trunk ${sipTrunk} to ${phoneNumber}, channel: ${returnedChannelId}`);
            return returnedChannelId;
        }
        catch (error) {
            this.logger.error(`Failed to make call to ${phoneNumber}`, error.response?.data || error.message);
            throw error;
        }
    }
    async hangupCall(channelId) {
        try {
            await axios_1.default.delete(`${this.ariUrl}/ari/channels/${channelId}`, {
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`Call hung up: ${channelId}`);
        }
        catch (error) {
            this.logger.error(`Failed to hangup call ${channelId}`, error.response?.data || error.message);
            throw error;
        }
    }
    async getChannelStatus(channelId) {
        try {
            const response = await axios_1.default.get(`${this.ariUrl}/ari/channels/${channelId}`, {
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get channel status ${channelId}`, error.response?.data || error.message);
            throw error;
        }
    }
    async answerCall(channelId) {
        try {
            await axios_1.default.post(`${this.ariUrl}/ari/channels/${channelId}/answer`, {}, {
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`Call answered: ${channelId}`);
        }
        catch (error) {
            this.logger.error(`Failed to answer call ${channelId}`, error.response?.data || error.message);
            throw error;
        }
    }
    async playAudioFile(channelId, audioFile) {
        try {
            if (audioFile === 'beep' || audioFile === 'demo-thanks' || audioFile === 'demo-congrats') {
                await this.playBuiltinSound(channelId, audioFile);
            }
            else {
                await this.playCustomAudio(channelId, audioFile);
            }
        }
        catch (error) {
            this.logger.error(`Failed to play audio ${audioFile} on channel ${channelId}`, error.response?.data || error.message);
            throw error;
        }
    }
    async playBuiltinSound(channelId, sound) {
        try {
            await axios_1.default.post(`${this.ariUrl}/ari/channels/${channelId}/play`, {
                media: `sound:${sound}`
            }, {
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`Playing builtin sound: ${sound}`);
        }
        catch (error) {
            this.logger.error(`Failed to play builtin sound ${sound}`, error.response?.data || error.message);
            throw error;
        }
    }
    async playCustomAudio(channelId, audioFilePath) {
        try {
            const fileName = audioFilePath.split('/').pop() || audioFilePath;
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
            this.logger.log(`Playing custom audio: voicedesk/${nameWithoutExt}`);
            await axios_1.default.post(`${this.ariUrl}/ari/channels/${channelId}/play`, {
                media: `sound:voicedesk/${nameWithoutExt}`
            }, {
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
        }
        catch (error) {
            this.logger.error(`Failed to play custom audio ${audioFilePath}`, error.response?.data || error.message);
            throw error;
        }
    }
    async createExternalMedia(app, externalHost, format = 'ulaw') {
        try {
            this.logger.log(`Creating external media channel: app=${app}, host=${externalHost}, format=${format}`);
            const response = await axios_1.default.post(`${this.ariUrl}/ari/channels/externalMedia`, null, {
                params: {
                    app: app,
                    external_host: externalHost,
                    format: format,
                    encapsulation: 'rtp',
                    transport: 'udp',
                    connection_type: 'client',
                    direction: 'both'
                },
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`External media channel created: ${response.data.id}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to create external media channel`, error.response?.data || error.message);
            throw error;
        }
    }
    async addChannelToBridge(bridgeId, channelId, role = 'participant') {
        try {
            await axios_1.default.post(`${this.ariUrl}/ari/bridges/${bridgeId}/addChannel`, null, {
                params: {
                    channel: channelId,
                    role: role
                },
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`Added channel ${channelId} to bridge ${bridgeId} with role ${role}`);
        }
        catch (error) {
            this.logger.error(`Failed to add channel to bridge`, error.response?.data || error.message);
            throw error;
        }
    }
    async createBridge(bridgeType = 'mixing') {
        try {
            const response = await axios_1.default.post(`${this.ariUrl}/ari/bridges`, null, {
                params: {
                    type: bridgeType
                },
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`Bridge created: ${response.data.id}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to create bridge`, error.response?.data || error.message);
            throw error;
        }
    }
    async destroyBridge(bridgeId) {
        try {
            await axios_1.default.delete(`${this.ariUrl}/ari/bridges/${bridgeId}`, {
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`Bridge destroyed: ${bridgeId}`);
        }
        catch (error) {
            this.logger.error(`Failed to destroy bridge ${bridgeId}`, error.response?.data || error.message);
        }
    }
    async startRecording(channelId, name, format = 'wav') {
        try {
            const response = await axios_1.default.post(`${this.ariUrl}/ari/channels/${channelId}/record`, null, {
                params: {
                    name: name,
                    format: format,
                    maxDurationSeconds: 3600,
                    maxSilenceSeconds: 0,
                    ifExists: 'overwrite',
                    beep: false,
                    terminateOn: 'none'
                },
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`Started recording on channel ${channelId}: ${name}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to start recording on ${channelId}`, error.response?.data || error.message);
            throw error;
        }
    }
    async stopRecording(recordingName) {
        try {
            await axios_1.default.post(`${this.ariUrl}/ari/recordings/live/${recordingName}/stop`, null, {
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`Stopped recording: ${recordingName}`);
        }
        catch (error) {
            this.logger.error(`Failed to stop recording ${recordingName}`, error.response?.data || error.message);
        }
    }
    async createSnoopChannel(channelId, app, spy = 'both', whisper = 'none') {
        try {
            const snoopId = `snoop-${Date.now()}`;
            const response = await axios_1.default.post(`${this.ariUrl}/ari/channels/${channelId}/snoop/${snoopId}`, null, {
                params: {
                    app: app,
                    spy: spy,
                    whisper: whisper
                },
                headers: {
                    'Authorization': `Basic ${this.ariAuth}`
                }
            });
            this.logger.log(`Snoop channel created: ${response.data.id} for ${channelId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to create snoop channel for ${channelId}`, error.response?.data || error.message);
            throw error;
        }
    }
};
exports.AsteriskService = AsteriskService;
exports.AsteriskService = AsteriskService = AsteriskService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AsteriskService);
//# sourceMappingURL=asterisk.service.js.map