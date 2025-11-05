import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsteriskService } from '../asterisk/asterisk.service';
import { AiConversationService } from '../ai-conversation/ai-conversation.service';
import * as WebSocket from 'ws';
import * as dgram from 'dgram';
import * as fs from 'fs';

/**
 * Real-time Audio Streaming using Asterisk External Media
 * This provides TRUE real-time bidirectional audio without disk I/O
 */
@Injectable()
export class IncomingCallsExternalMediaService {
  private readonly logger = new Logger(IncomingCallsExternalMediaService.name);
  
  constructor(
    private asteriskService: AsteriskService,
    private aiConversationService: AiConversationService,
    private configService: ConfigService,
  ) {}

  /**
   * Handle incoming call with real-time audio streaming
   * Uses External Media + Bridge architecture
   */
  async handleIncomingCall(callerNumber: string, channelId: string): Promise<void> {
    // Ignore snoop channels
    if (channelId.startsWith('snoop-')) {
      this.logger.debug(`Ignoring snoop channel: ${channelId}`);
      return;
    }

    let bridge = null;
    let externalMediaChannel = null;
    let rtpSocket = null;
    let pipecatWs: WebSocket | null = null;
    let asteriskRtpHost = null;
    let asteriskRtpPort = null;

    try {
      this.logger.log(`Handling incoming call from ${callerNumber} on channel ${channelId}`);
      
      // Answer the call
      await this.asteriskService.answerCall(channelId);
      this.logger.log('Call answered successfully');

      // Wait a moment
      await this.sleep(1000);

      // Check if AI is enabled
      if (!this.aiConversationService.isEnabled()) {
        this.logger.log('AI Conversation disabled - playing fallback audio');
        await this.playFallbackAudio(channelId);
        return;
      }

      this.logger.log('AI Conversation enabled - setting up real-time streaming');

      const callId = `call_${Date.now()}_${channelId}`;

      // Step 1: Connect to Pipecat Agent
      pipecatWs = await this.aiConversationService.startConversation(callId, callerNumber, channelId);
      if (!pipecatWs) {
        throw new Error('Failed to connect to Pipecat Agent');
      }
      this.logger.log(`Connected to Pipecat Agent for call ${callId}`);

      // Step 2: Create a mixing bridge
      bridge = await this.asteriskService.createBridge('mixing');
      this.logger.log(`Created bridge: ${bridge.id}`);

      // Step 3: Add caller channel to bridge
      await this.asteriskService.addChannelToBridge(bridge.id, channelId);
      this.logger.log(`Added caller channel to bridge`);

      // Step 4: Create UDP socket for RTP
      rtpSocket = dgram.createSocket('udp4');
      const rtpPort = await this.bindSocket(rtpSocket);
      this.logger.log(`RTP socket bound to port ${rtpPort}`);

      // Step 5: Create External Media channel
      // This will stream audio to/from our RTP socket
      const externalHost = `host.docker.internal:${rtpPort}`;
      externalMediaChannel = await this.asteriskService.createExternalMedia(
        'voicedesk',
        externalHost,
        'ulaw'  // Use µ-law codec (8kHz, compatible with telephony)
      );
      this.logger.log(`External Media channel created: ${externalMediaChannel.id}`);

      // Step 6: Add External Media channel to bridge
      await this.asteriskService.addChannelToBridge(bridge.id, externalMediaChannel.id);
      this.logger.log(`External Media channel added to bridge - audio now flowing!`);

      // Step 7: Set up RTP packet handling
      rtpSocket.on('message', (msg, rinfo) => {
        // Store Asterisk's RTP endpoint
        if (!asteriskRtpHost) {
          asteriskRtpHost = rinfo.address;
          asteriskRtpPort = rinfo.port;
          this.logger.log(`Asterisk RTP endpoint: ${asteriskRtpHost}:${asteriskRtpPort}`);
        }

        // Extract audio payload from RTP packet (skip 12-byte RTP header)
        const audioPayload = msg.slice(12);
        
        // Convert to base64 and send to Pipecat
        if (pipecatWs && pipecatWs.readyState === WebSocket.OPEN) {
          const audioMessage = {
            type: 'audio',
            audio: audioPayload.toString('base64'),
            sample_rate: 8000,
            num_channels: 1,
            codec: 'ulaw',
            timestamp: Date.now()
          };
          pipecatWs.send(JSON.stringify(audioMessage));
        }
      });

      // Step 8: Handle audio FROM Pipecat TO Asterisk
      pipecatWs.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'audio' && message.audio) {
            const audioBuffer = Buffer.from(message.audio, 'base64');
            
            // Send audio to Asterisk via RTP
            if (asteriskRtpHost && asteriskRtpPort && rtpSocket) {
              const rtpPacket = this.createRtpPacket(audioBuffer);
              rtpSocket.send(rtpPacket, asteriskRtpPort, asteriskRtpHost);
            }
          } else if (message.type === 'tts_audio') {
            // Handle ElevenLabs TTS audio
            const audioBuffer = Buffer.from(message.audio, 'base64');
            
            if (asteriskRtpHost && asteriskRtpPort && rtpSocket) {
              const rtpPacket = this.createRtpPacket(audioBuffer);
              rtpSocket.send(rtpPacket, asteriskRtpPort, asteriskRtpHost);
            }
          }
        } catch (error) {
          this.logger.error(`Error processing Pipecat message: ${error.message}`);
        }
      });

      // Step 9: Monitor call status
      const monitorInterval = setInterval(async () => {
        try {
          const status = await this.asteriskService.getChannelStatus(channelId);
          if (!status || status.state === 'Down') {
            this.logger.log(`Call ${callId} ended`);
            clearInterval(monitorInterval);
            await this.cleanup(bridge, externalMediaChannel, rtpSocket, pipecatWs);
          }
        } catch (error) {
          clearInterval(monitorInterval);
          await this.cleanup(bridge, externalMediaChannel, rtpSocket, pipecatWs);
        }
      }, 2000);

      // Max call duration: 30 minutes
      setTimeout(async () => {
        clearInterval(monitorInterval);
        await this.cleanup(bridge, externalMediaChannel, rtpSocket, pipecatWs);
        this.asteriskService.hangupCall(channelId).catch(() => {});
      }, 30 * 60 * 1000);

    } catch (error) {
      this.logger.error(`Error handling call: ${error.message}`);
      await this.cleanup(bridge, externalMediaChannel, rtpSocket, pipecatWs);
      
      // Fallback to static audio
      try {
        await this.playFallbackAudio(channelId);
      } catch (fallbackError) {
        this.logger.error(`Fallback audio failed: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Bind UDP socket to an available port
   */
  private bindSocket(socket: dgram.Socket): Promise<number> {
    return new Promise((resolve, reject) => {
      const minPort = 20000;
      const maxPort = 30000;
      const port = Math.floor(Math.random() * (maxPort - minPort) + minPort);

      socket.bind(port, '0.0.0.0', () => {
        resolve(port);
      });

      socket.on('error', reject);
    });
  }

  /**
   * Create an RTP packet with proper header
   */
  private createRtpPacket(payload: Buffer): Buffer {
    const header = Buffer.alloc(12);
    
    // RTP Version 2, no padding, no extension, no CSRC
    header[0] = 0x80;
    
    // Payload type 0 (PCMU/µ-law)
    header[1] = 0x00;
    
    // Sequence number (would need to track this properly)
    const seqNum = Math.floor(Math.random() * 65535);
    header.writeUInt16BE(seqNum, 2);
    
    // Timestamp (would need to track this properly)
    const timestamp = Date.now() & 0xFFFFFFFF;
    header.writeUInt32BE(timestamp, 4);
    
    // SSRC
    const ssrc = 0x12345678;
    header.writeUInt32BE(ssrc, 8);
    
    return Buffer.concat([header, payload]);
  }

  /**
   * Clean up resources
   */
  private async cleanup(
    bridge: any,
    externalMediaChannel: any,
    rtpSocket: dgram.Socket | null,
    pipecatWs: WebSocket | null
  ): Promise<void> {
    this.logger.log('Cleaning up call resources');

    // Close RTP socket
    if (rtpSocket) {
      try {
        rtpSocket.close();
      } catch (e) {}
    }

    // Close Pipecat connection
    if (pipecatWs) {
      this.aiConversationService.endConversation(pipecatWs);
    }

    // Hangup external media channel
    if (externalMediaChannel) {
      try {
        await this.asteriskService.hangupCall(externalMediaChannel.id);
      } catch (e) {}
    }

    // Destroy bridge
    if (bridge) {
      try {
        await this.asteriskService.destroyBridge(bridge.id);
      } catch (e) {}
    }
  }

  /**
   * Play fallback audio if AI fails
   */
  private async playFallbackAudio(channelId: string): Promise<void> {
    try {
      this.logger.log('Playing fallback audio');
      await this.asteriskService.playAudioFile(channelId, '/app/audio/intro_1760256231995_8k.wav');
      await this.sleep(10000);
      await this.asteriskService.hangupCall(channelId);
    } catch (error) {
      this.logger.error(`Fallback audio error: ${error.message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

