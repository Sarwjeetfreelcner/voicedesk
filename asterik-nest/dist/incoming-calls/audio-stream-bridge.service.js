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
var AudioStreamBridgeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioStreamBridgeService = void 0;
const common_1 = require("@nestjs/common");
const asterisk_service_1 = require("../asterisk/asterisk.service");
const WebSocket = require("ws");
const dgram = require("dgram");
const events_1 = require("events");
let AudioStreamBridgeService = AudioStreamBridgeService_1 = class AudioStreamBridgeService extends events_1.EventEmitter {
    constructor(asteriskService) {
        super();
        this.asteriskService = asteriskService;
        this.logger = new common_1.Logger(AudioStreamBridgeService_1.name);
        this.bridges = new Map();
    }
    async createBridge(callId, channelId, pipecatWs) {
        try {
            this.logger.log(`Creating audio bridge for call ${callId}`);
            const rtpSocket = dgram.createSocket('udp4');
            const rtpPort = await this.bindSocket(rtpSocket);
            this.logger.log(`RTP socket bound to port ${rtpPort}`);
            const bridge = {
                callId,
                channelId,
                rtpSocket,
                rtpPort,
                pipecatWs,
                asteriskHost: null,
                asteriskPort: null,
                active: true
            };
            rtpSocket.on('message', (msg, rinfo) => {
                if (!bridge.active)
                    return;
                if (!bridge.asteriskHost) {
                    bridge.asteriskHost = rinfo.address;
                    bridge.asteriskPort = rinfo.port;
                    this.logger.log(`Asterisk RTP endpoint: ${rinfo.address}:${rinfo.port}`);
                }
                const audioPayload = msg.slice(12);
                this.sendAudioToPipecat(pipecatWs, audioPayload);
            });
            pipecatWs.on('message', (data) => {
                if (!bridge.active)
                    return;
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'audio' && message.audio) {
                        const audioBuffer = Buffer.from(message.audio, 'base64');
                        this.sendAudioToAsterisk(bridge, audioBuffer);
                    }
                }
                catch (error) {
                    this.logger.error(`Error processing Pipecat message: ${error.message}`);
                }
            });
            pipecatWs.on('close', () => {
                this.destroyBridge(callId);
            });
            rtpSocket.on('error', (error) => {
                this.logger.error(`RTP socket error: ${error.message}`);
                this.destroyBridge(callId);
            });
            this.bridges.set(callId, bridge);
            return rtpPort;
        }
        catch (error) {
            this.logger.error(`Failed to create audio bridge: ${error.message}`);
            throw error;
        }
    }
    async destroyBridge(callId) {
        const bridge = this.bridges.get(callId);
        if (!bridge)
            return;
        this.logger.log(`Destroying audio bridge for call ${callId}`);
        bridge.active = false;
        try {
            bridge.rtpSocket.close();
        }
        catch (error) {
            this.logger.warn(`Error closing RTP socket: ${error.message}`);
        }
        this.bridges.delete(callId);
        this.emit('bridge-destroyed', callId);
    }
    bindSocket(socket) {
        return new Promise((resolve, reject) => {
            const minPort = 20000;
            const maxPort = 30000;
            const port = Math.floor(Math.random() * (maxPort - minPort) + minPort);
            socket.bind(port, '0.0.0.0', () => {
                resolve(port);
            });
            socket.on('error', (error) => {
                reject(error);
            });
        });
    }
    sendAudioToPipecat(ws, audioBuffer) {
        if (ws.readyState !== WebSocket.OPEN)
            return;
        try {
            const message = {
                type: 'audio',
                audio: audioBuffer.toString('base64'),
                sample_rate: 8000,
                num_channels: 1,
                codec: 'ulaw',
                timestamp: Date.now()
            };
            ws.send(JSON.stringify(message));
        }
        catch (error) {
            this.logger.error(`Error sending audio to Pipecat: ${error.message}`);
        }
    }
    sendAudioToAsterisk(bridge, audioBuffer) {
        if (!bridge.asteriskHost || !bridge.asteriskPort) {
            return;
        }
        try {
            const rtpPacket = this.createRtpPacket(audioBuffer, bridge);
            bridge.rtpSocket.send(rtpPacket, bridge.asteriskPort, bridge.asteriskHost, (error) => {
                if (error) {
                    this.logger.error(`Error sending RTP packet: ${error.message}`);
                }
            });
        }
        catch (error) {
            this.logger.error(`Error sending audio to Asterisk: ${error.message}`);
        }
    }
    createRtpPacket(payload, bridge) {
        const header = Buffer.alloc(12);
        header[0] = 0x80;
        header[1] = 0x00;
        const seqNum = Math.floor(Math.random() * 65535);
        header.writeUInt16BE(seqNum, 2);
        const timestamp = Date.now() & 0xFFFFFFFF;
        header.writeUInt32BE(timestamp, 4);
        const ssrc = 0x12345678;
        header.writeUInt32BE(ssrc, 8);
        return Buffer.concat([header, payload]);
    }
};
exports.AudioStreamBridgeService = AudioStreamBridgeService;
exports.AudioStreamBridgeService = AudioStreamBridgeService = AudioStreamBridgeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [asterisk_service_1.AsteriskService])
], AudioStreamBridgeService);
//# sourceMappingURL=audio-stream-bridge.service.js.map