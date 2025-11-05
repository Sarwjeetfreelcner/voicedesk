import { Injectable, Logger } from '@nestjs/common';
import { AsteriskService } from '../asterisk/asterisk.service';
import * as WebSocket from 'ws';
import * as dgram from 'dgram';
import { EventEmitter } from 'events';

/**
 * Audio Stream Bridge Service
 * Creates a real-time bidirectional audio bridge between Asterisk and Pipecat
 * using RTP/UDP for Asterisk and WebSocket for Pipecat
 */
@Injectable()
export class AudioStreamBridgeService extends EventEmitter {
  private readonly logger = new Logger(AudioStreamBridgeService.name);
  private bridges: Map<string, AudioBridge> = new Map();

  constructor(private asteriskService: AsteriskService) {
    super();
  }

  /**
   * Create a bidirectional audio bridge
   * Returns the local RTP port for Asterisk to connect to
   */
  async createBridge(
    callId: string,
    channelId: string,
    pipecatWs: WebSocket
  ): Promise<number> {
    try {
      this.logger.log(`Creating audio bridge for call ${callId}`);

      // Create UDP socket for RTP audio from/to Asterisk
      const rtpSocket = dgram.createSocket('udp4');
      const rtpPort = await this.bindSocket(rtpSocket);

      this.logger.log(`RTP socket bound to port ${rtpPort}`);

      const bridge: AudioBridge = {
        callId,
        channelId,
        rtpSocket,
        rtpPort,
        pipecatWs,
        asteriskHost: null,
        asteriskPort: null,
        active: true
      };

      // Handle RTP packets from Asterisk -> send to Pipecat
      rtpSocket.on('message', (msg, rinfo) => {
        if (!bridge.active) return;

        // Store Asterisk's RTP address for sending audio back
        if (!bridge.asteriskHost) {
          bridge.asteriskHost = rinfo.address;
          bridge.asteriskPort = rinfo.port;
          this.logger.log(`Asterisk RTP endpoint: ${rinfo.address}:${rinfo.port}`);
        }

        // Extract audio payload from RTP packet (skip RTP header - 12 bytes)
        const audioPayload = msg.slice(12);
        
        // Convert µ-law to base64 and send to Pipecat
        this.sendAudioToPipecat(pipecatWs, audioPayload);
      });

      // Handle audio from Pipecat -> send to Asterisk via RTP
      pipecatWs.on('message', (data: WebSocket.Data) => {
        if (!bridge.active) return;
        
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'audio' && message.audio) {
            const audioBuffer = Buffer.from(message.audio, 'base64');
            this.sendAudioToAsterisk(bridge, audioBuffer);
          }
        } catch (error) {
          this.logger.error(`Error processing Pipecat message: ${error.message}`);
        }
      });

      // Handle cleanup
      pipecatWs.on('close', () => {
        this.destroyBridge(callId);
      });

      rtpSocket.on('error', (error) => {
        this.logger.error(`RTP socket error: ${error.message}`);
        this.destroyBridge(callId);
      });

      this.bridges.set(callId, bridge);

      return rtpPort;

    } catch (error) {
      this.logger.error(`Failed to create audio bridge: ${error.message}`);
      throw error;
    }
  }

  /**
   * Destroy an audio bridge and clean up resources
   */
  async destroyBridge(callId: string): Promise<void> {
    const bridge = this.bridges.get(callId);
    if (!bridge) return;

    this.logger.log(`Destroying audio bridge for call ${callId}`);

    bridge.active = false;

    try {
      bridge.rtpSocket.close();
    } catch (error) {
      this.logger.warn(`Error closing RTP socket: ${error.message}`);
    }

    this.bridges.delete(callId);
    this.emit('bridge-destroyed', callId);
  }

  /**
   * Bind UDP socket to an available port
   */
  private bindSocket(socket: dgram.Socket): Promise<number> {
    return new Promise((resolve, reject) => {
      // Try ports in the range 20000-30000 (avoid conflicts with Asterisk RTP range)
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

  /**
   * Send audio from Asterisk to Pipecat
   */
  private sendAudioToPipecat(ws: WebSocket, audioBuffer: Buffer): void {
    if (ws.readyState !== WebSocket.OPEN) return;

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
    } catch (error) {
      this.logger.error(`Error sending audio to Pipecat: ${error.message}`);
    }
  }

  /**
   * Send audio from Pipecat to Asterisk via RTP
   */
  private sendAudioToAsterisk(bridge: AudioBridge, audioBuffer: Buffer): void {
    if (!bridge.asteriskHost || !bridge.asteriskPort) {
      // Asterisk hasn't sent us any packets yet, can't send back
      return;
    }

    try {
      // Create RTP packet
      const rtpPacket = this.createRtpPacket(audioBuffer, bridge);
      
      // Send via UDP to Asterisk
      bridge.rtpSocket.send(
        rtpPacket,
        bridge.asteriskPort,
        bridge.asteriskHost,
        (error) => {
          if (error) {
            this.logger.error(`Error sending RTP packet: ${error.message}`);
          }
        }
      );
    } catch (error) {
      this.logger.error(`Error sending audio to Asterisk: ${error.message}`);
    }
  }

  /**
   * Create an RTP packet (simplified - basic header only)
   */
  private createRtpPacket(payload: Buffer, bridge: AudioBridge): Buffer {
    // RTP Header (12 bytes)
    const header = Buffer.alloc(12);
    
    // Version (2 bits) = 2, Padding (1 bit) = 0, Extension (1 bit) = 0, CSRC count (4 bits) = 0
    header[0] = 0x80; // 10000000
    
    // Marker (1 bit) = 0, Payload type (7 bits) = 0 (PCMU/µ-law)
    header[1] = 0x00;
    
    // Sequence number (16 bits) - would need to track this per bridge
    const seqNum = Math.floor(Math.random() * 65535);
    header.writeUInt16BE(seqNum, 2);
    
    // Timestamp (32 bits) - would need to track this properly
    const timestamp = Date.now() & 0xFFFFFFFF;
    header.writeUInt32BE(timestamp, 4);
    
    // SSRC (32 bits) - synchronization source identifier
    const ssrc = 0x12345678;
    header.writeUInt32BE(ssrc, 8);
    
    // Concatenate header + payload
    return Buffer.concat([header, payload]);
  }
}

interface AudioBridge {
  callId: string;
  channelId: string;
  rtpSocket: dgram.Socket;
  rtpPort: number;
  pipecatWs: WebSocket;
  asteriskHost: string | null;
  asteriskPort: number | null;
  active: boolean;
}

