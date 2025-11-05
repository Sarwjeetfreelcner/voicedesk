import { Injectable, Logger } from '@nestjs/common';
import * as dgram from 'dgram';
import * as WebSocket from 'ws';

/**
 * µ-law to 16-bit PCM lookup table (for decoding Asterisk audio)
 */
const ULAW_TO_PCM: number[] = [
  -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956,
  -23932, -22908, -21884, -20860, -19836, -18812, -17788, -16764,
  -15996, -15484, -14972, -14460, -13948, -13436, -12924, -12412,
  -11900, -11388, -10876, -10364, -9852, -9340, -8828, -8316,
  -7932, -7676, -7420, -7164, -6908, -6652, -6396, -6140,
  -5884, -5628, -5372, -5116, -4860, -4604, -4348, -4092,
  -3900, -3772, -3644, -3516, -3388, -3260, -3132, -3004,
  -2876, -2748, -2620, -2492, -2364, -2236, -2108, -1980,
  -1884, -1820, -1756, -1692, -1628, -1564, -1500, -1436,
  -1372, -1308, -1244, -1180, -1116, -1052, -988, -924,
  -876, -844, -812, -780, -748, -716, -684, -652,
  -620, -588, -556, -524, -492, -460, -428, -396,
  -372, -356, -340, -324, -308, -292, -276, -260,
  -244, -228, -212, -196, -180, -164, -148, -132,
  -120, -112, -104, -96, -88, -80, -72, -64,
  -56, -48, -40, -32, -24, -16, -8, 0,
  32124, 31100, 30076, 29052, 28028, 27004, 25980, 24956,
  23932, 22908, 21884, 20860, 19836, 18812, 17788, 16764,
  15996, 15484, 14972, 14460, 13948, 13436, 12924, 12412,
  11900, 11388, 10876, 10364, 9852, 9340, 8828, 8316,
  7932, 7676, 7420, 7164, 6908, 6652, 6396, 6140,
  5884, 5628, 5372, 5116, 4860, 4604, 4348, 4092,
  3900, 3772, 3644, 3516, 3388, 3260, 3132, 3004,
  2876, 2748, 2620, 2492, 2364, 2236, 2108, 1980,
  1884, 1820, 1756, 1692, 1628, 1564, 1500, 1436,
  1372, 1308, 1244, 1180, 1116, 1052, 988, 924,
  876, 844, 812, 780, 748, 716, 684, 652,
  620, 588, 556, 524, 492, 460, 428, 396,
  372, 356, 340, 324, 308, 292, 276, 260,
  244, 228, 212, 196, 180, 164, 148, 132,
  120, 112, 104, 96, 88, 80, 72, 64,
  56, 48, 40, 32, 24, 16, 8, 0
];

/**
 * Convert 16-bit PCM to µ-law (ITU-T G.711 standard - OPTIMIZED)
 * Reference: ITU-T Recommendation G.711 (1988) - Appendix I
 * This is the reference implementation used in professional telephony systems
 */
function pcmToUlaw(pcm: number): number {
  // ITU-T G.711 constants
  const CLIP = 32635;  // Maximum value before clipping
  const BIAS = 0x84;   // Bias for µ-law encoding (132 decimal)
  
  // Step 1: Get sign bit and magnitude
  let sign: number;
  let magnitude: number;
  
  if (pcm < 0) {
    sign = 0x80;  // Sign bit set for negative
    magnitude = Math.min(-pcm, CLIP);
  } else {
    sign = 0x00;  // Sign bit clear for positive
    magnitude = Math.min(pcm, CLIP);
  }
  
  // Step 2: Add bias for logarithmic compression
  magnitude += BIAS;
  
  // Step 3: Find the exponent (segment) - logarithmic search
  // This determines which compression range the sample falls into
  let exponent = 0;
  
  if (magnitude >= 256) {
    // Use binary search for efficiency
    if (magnitude >= 4096) {
      if (magnitude >= 16384) {
        exponent = 7;
      } else if (magnitude >= 8192) {
        exponent = 6;
      } else {
        exponent = 5;
      }
    } else {
      if (magnitude >= 2048) {
        exponent = 4;
      } else if (magnitude >= 1024) {
        exponent = 3;
      } else if (magnitude >= 512) {
        exponent = 2;
      } else {
        exponent = 1;
      }
    }
  }
  
  // Step 4: Extract mantissa (4 bits) from the appropriate bit position
  const mantissa = (magnitude >> (exponent + 3)) & 0x0F;
  
  // Step 5: Combine sign, exponent, and mantissa, then invert per G.711 spec
  const ulawByte = ~(sign | (exponent << 4) | mantissa);
  
  return ulawByte & 0xFF;
}

/**
 * RTP Audio Bridge Service
 * Handles bidirectional audio streaming between Asterisk (RTP) and Pipecat (WebSocket)
 */
@Injectable()
export class RtpAudioBridgeService {
  private readonly logger = new Logger(RtpAudioBridgeService.name);
  private activeBridges: Map<string, AudioBridge> = new Map();

  /**
   * Create a bidirectional audio bridge
   * Returns the local RTP port for Asterisk to connect to
   */
  async createBridge(
    callId: string,
    pipecatWs: WebSocket
  ): Promise<{ rtpPort: number; rtpHost: string }> {
    try {
      this.logger.log(`🔧 [RTP Bridge] Starting to create audio bridge for call ${callId}`);

      // Create UDP socket for RTP
      this.logger.debug(`[RTP Bridge] Creating UDP socket for RTP...`);
      const rtpSocket = dgram.createSocket('udp4');
      
      this.logger.debug(`[RTP Bridge] Binding socket to available port...`);
      const rtpPort = await this.bindSocket(rtpSocket);
      
      // Get container hostname (voicedesk-app)
      const rtpHost = 'voicedesk-app';

      this.logger.log(`✅ [RTP Bridge] RTP socket successfully bound to ${rtpHost}:${rtpPort}`);

      const bridge: AudioBridge = {
        callId,
        rtpSocket,
        rtpPort,
        rtpHost,
        pipecatWs,
        asteriskRtpHost: null,
        asteriskRtpPort: null,
        sequenceNumber: Math.floor(Math.random() * 65535),
        timestamp: Date.now(),
        ssrc: Math.floor(Math.random() * 0xFFFFFFFF),
        packetsReceived: 0,
        packetsSent: 0,
        bytesReceived: 0,
        bytesSent: 0
      };

      this.logger.debug(`[RTP Bridge] Bridge object created with SSRC: ${bridge.ssrc}`);

      // Handle RTP packets FROM Asterisk TO Pipecat
      this.logger.debug(`[RTP Bridge] Setting up RTP packet handler (Asterisk → Pipecat)...`);
      rtpSocket.on('message', (msg, rinfo) => {
        this.handleIncomingRtp(bridge, msg, rinfo);
      });

      // Handle audio FROM Pipecat TO Asterisk
      this.logger.debug(`[RTP Bridge] Setting up WebSocket message handler (Pipecat → Asterisk)...`);
      pipecatWs.on('message', (data: WebSocket.Data) => {
        this.handlePipecatAudio(bridge, data);
      });

      // Handle socket errors
      rtpSocket.on('error', (error) => {
        this.logger.error(`❌ [RTP Bridge] RTP socket error for ${callId}: ${error.message}`);
        this.logger.error(`[RTP Bridge] Stack trace: ${error.stack}`);
        this.destroyBridge(callId);
      });

      // Handle WebSocket close
      pipecatWs.on('close', () => {
        this.logger.log(`🔌 [RTP Bridge] Pipecat WebSocket closed for ${callId}`);
        this.destroyBridge(callId);
      });

      this.activeBridges.set(callId, bridge);
      this.logger.log(`✅ [RTP Bridge] Audio bridge created and registered for ${callId}`);

      return { rtpPort, rtpHost };

    } catch (error) {
      this.logger.error(`Failed to create audio bridge: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle incoming RTP packet from Asterisk
   */
  private handleIncomingRtp(bridge: AudioBridge, msg: Buffer, rinfo: dgram.RemoteInfo): void {
    try {
      // Store Asterisk's RTP endpoint on first packet
      if (!bridge.asteriskRtpHost) {
        bridge.asteriskRtpHost = rinfo.address;
        bridge.asteriskRtpPort = rinfo.port;
        this.logger.log(`🎤 [RTP Bridge] First packet received! Asterisk RTP endpoint: ${rinfo.address}:${rinfo.port}`);
      }

      // RTP packet structure:
      // 0-11: RTP Header (12 bytes)
      // 12+: Audio Payload

      if (msg.length < 12) {
        this.logger.warn(`[RTP Bridge] Invalid RTP packet received (too short: ${msg.length} bytes)`);
        return; // Invalid RTP packet
      }

      // Extract audio payload (skip 12-byte RTP header)
      const audioPayload = msg.slice(12);

      // Update stats
      bridge.packetsReceived++;
      bridge.bytesReceived += audioPayload.length;

      // Log first packet
      if (bridge.packetsReceived === 1) {
        this.logger.log(`🎵 [RTP Bridge] First audio packet processed: ${audioPayload.length} bytes (µ-law format)`);
      }

      // Convert µ-law to 16-bit PCM for Pipecat
      // Asterisk sends µ-law (1 byte per sample), Pipecat expects 16-bit PCM (2 bytes per sample)
      const pcmBuffer = Buffer.alloc(audioPayload.length * 2); // 2 bytes per sample
      for (let i = 0; i < audioPayload.length; i++) {
        const ulawByte = audioPayload[i];
        const pcmValue = ULAW_TO_PCM[ulawByte];
        pcmBuffer.writeInt16LE(pcmValue, i * 2);
      }

      // Log periodically
      if (bridge.packetsReceived % 100 === 0) {
        this.logger.debug(
          `📊 [RTP Bridge] Stats for ${bridge.callId}: ` +
          `RX=${bridge.packetsReceived} packets (${bridge.bytesReceived} bytes µ-law → ${bridge.bytesReceived * 2} bytes PCM), ` +
          `TX=${bridge.packetsSent} packets (${bridge.bytesSent} bytes)`
        );
      }

      // Send 16-bit PCM to Pipecat via WebSocket
      if (bridge.pipecatWs.readyState === WebSocket.OPEN) {
        const message = {
          type: 'audio',
          audio: pcmBuffer.toString('base64'),
          sample_rate: 8000,
          num_channels: 1
        };

        bridge.pipecatWs.send(JSON.stringify(message));
        
        // Log first WebSocket send
        if (bridge.packetsReceived === 1) {
          this.logger.log(`📡 [RTP Bridge] First audio packet sent to Pipecat via WebSocket (converted to 16-bit PCM)`);
        }
      } else {
        if (bridge.packetsReceived === 1) {
          this.logger.warn(`⚠️ [RTP Bridge] WebSocket not open (state: ${bridge.pipecatWs.readyState}), cannot send audio to Pipecat`);
        }
      }

    } catch (error) {
      this.logger.error(`❌ [RTP Bridge] Error handling RTP packet: ${error.message}`);
      this.logger.error(`[RTP Bridge] Stack trace: ${error.stack}`);
    }
  }

  /**
   * Handle audio from Pipecat to send to Asterisk
   */
  private handlePipecatAudio(bridge: AudioBridge, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      
      // Log all message types from Pipecat for debugging
      if (bridge.packetsSent === 0 && bridge.packetsReceived === 0) {
        this.logger.debug(`[RTP Bridge] First WebSocket message from Pipecat: type="${message.type}"`);
      }

      if (message.type === 'audio' && message.audio) {
        // Decode base64 audio (16-bit PCM from Pipecat)
        const audioBuffer = Buffer.from(message.audio, 'base64');

        // Log first audio from Pipecat
        if (bridge.packetsSent === 0) {
          this.logger.log(`🔊 [RTP Bridge] First audio received from Pipecat: ${audioBuffer.length} bytes (16-bit PCM)`);
        }

        // Step 1: Find peak amplitude for normalization (prevent clipping/distortion)
        let maxAmplitude = 0;
        for (let i = 0; i < audioBuffer.length; i += 2) {
          const pcmValue = Math.abs(audioBuffer.readInt16LE(i));
          if (pcmValue > maxAmplitude) {
            maxAmplitude = pcmValue;
          }
        }

        // Step 2: Calculate normalization factor (target 80% of max to prevent clipping)
        // This reduces distortion by ensuring audio doesn't clip
        const TARGET_LEVEL = 26108; // 80% of 32635 (max PCM value before clipping)
        const normalizationFactor = maxAmplitude > TARGET_LEVEL ? TARGET_LEVEL / maxAmplitude : 1.0;

        // Step 3: Convert 16-bit PCM to µ-law with normalization
        // Pipecat sends 16-bit PCM (2 bytes per sample), Asterisk expects µ-law (1 byte per sample)
        const ulawBuffer = Buffer.alloc(audioBuffer.length / 2);
        for (let i = 0; i < audioBuffer.length; i += 2) {
          let pcmValue = audioBuffer.readInt16LE(i);
          
          // Apply normalization to prevent distortion
          pcmValue = Math.round(pcmValue * normalizationFactor);
          
          const ulawByte = pcmToUlaw(pcmValue);
          ulawBuffer[i / 2] = ulawByte;
        }

        // Step 4: Split into 20ms RTP packets (160 bytes = 160 samples @ 8kHz = 20ms)
        // Pipecat sends 40ms chunks (320 samples), but RTP standard is 20ms packets
        // This prevents timing-related distortion
        const RTP_PACKET_SIZE = 160; // 20ms at 8kHz
        const numPackets = Math.ceil(ulawBuffer.length / RTP_PACKET_SIZE);

        // Only send if we know where Asterisk is
        if (bridge.asteriskRtpHost && bridge.asteriskRtpPort) {
          for (let packetIndex = 0; packetIndex < numPackets; packetIndex++) {
            const start = packetIndex * RTP_PACKET_SIZE;
            const end = Math.min(start + RTP_PACKET_SIZE, ulawBuffer.length);
            const packetPayload = ulawBuffer.slice(start, end);

            // Create RTP packet with proper 20ms payload
            const rtpPacket = this.createRtpPacket(bridge, packetPayload);

            // Send via UDP to Asterisk
            bridge.rtpSocket.send(
              rtpPacket,
              bridge.asteriskRtpPort,
              bridge.asteriskRtpHost,
              (error) => {
                if (error) {
                  this.logger.error(`❌ [RTP Bridge] Error sending RTP to Asterisk: ${error.message}`);
                } else {
                  bridge.packetsSent++;
                  bridge.bytesSent += packetPayload.length;
                  
                  // Log first successful send
                  if (bridge.packetsSent === 1) {
                    this.logger.log(`📤 [RTP Bridge] First RTP packet sent to Asterisk successfully! (20ms packets, µ-law)`);
                  }
                }
              }
            );
          }
        } else {
          if (bridge.packetsSent === 0) {
            this.logger.warn(`⚠️ [RTP Bridge] Cannot send audio to Asterisk - endpoint not yet known (waiting for first RTP packet from Asterisk)`);
          }
        }
      }

    } catch (error) {
      this.logger.error(`❌ [RTP Bridge] Error handling Pipecat audio: ${error.message}`);
      this.logger.error(`[RTP Bridge] Stack trace: ${error.stack}`);
    }
  }

  /**
   * Create an RTP packet with proper header
   */
  private createRtpPacket(bridge: AudioBridge, payload: Buffer): Buffer {
    const header = Buffer.alloc(12);

    // Byte 0: Version (2 bits) = 2, Padding = 0, Extension = 0, CSRC count = 0
    header[0] = 0x80; // 10000000 binary

    // Byte 1: Marker (1 bit) = 0, Payload type (7 bits) = 0 (PCMU/µ-law)
    // We convert 16-bit PCM from Pipecat to µ-law before sending to Asterisk
    header[1] = 0x00;  // Payload type 0 = PCMU (µ-law)

    // Bytes 2-3: Sequence number
    bridge.sequenceNumber = (bridge.sequenceNumber + 1) & 0xFFFF;
    header.writeUInt16BE(bridge.sequenceNumber, 2);

    // Bytes 4-7: Timestamp (increments by 160 for 8kHz, 20ms packets)
    bridge.timestamp += 160; // 20ms of audio at 8kHz
    header.writeUInt32BE(bridge.timestamp & 0xFFFFFFFF, 4);

    // Bytes 8-11: SSRC (Synchronization Source identifier)
    header.writeUInt32BE(bridge.ssrc, 8);

    // Concatenate header + payload
    return Buffer.concat([header, payload]);
  }

  /**
   * Bind UDP socket to an available port
   */
  private bindSocket(socket: dgram.Socket): Promise<number> {
    return new Promise((resolve, reject) => {
      // Use ports 20000-30000 to avoid conflicts with Asterisk's RTP range (10000-20000)
      const minPort = 20000;
      const maxPort = 30000;
      
      const tryBind = (port: number) => {
        socket.bind(port, '0.0.0.0', () => {
          resolve(port);
        });

        socket.once('error', (error: any) => {
          if (error.code === 'EADDRINUSE' && port < maxPort) {
            socket.removeAllListeners('error');
            tryBind(port + 1);
          } else {
            reject(error);
          }
        });
      };

      const initialPort = Math.floor(Math.random() * (maxPort - minPort) + minPort);
      tryBind(initialPort);
    });
  }

  /**
   * Destroy an audio bridge and clean up resources
   */
  async destroyBridge(callId: string): Promise<void> {
    const bridge = this.activeBridges.get(callId);
    if (!bridge) {
      this.logger.debug(`[RTP Bridge] No bridge found for ${callId} (may have been already destroyed)`);
      return;
    }

    this.logger.log(
      `🗑️ [RTP Bridge] Destroying audio bridge for ${callId}. ` +
      `Final Stats: RX=${bridge.packetsReceived} packets (${bridge.bytesReceived} bytes), ` +
      `TX=${bridge.packetsSent} packets (${bridge.bytesSent} bytes)`
    );

    try {
      bridge.rtpSocket.close();
      this.logger.debug(`[RTP Bridge] RTP socket closed successfully for ${callId}`);
    } catch (error) {
      this.logger.warn(`⚠️ [RTP Bridge] Error closing RTP socket: ${error.message}`);
    }

    this.activeBridges.delete(callId);
    this.logger.log(`✅ [RTP Bridge] Audio bridge destroyed for ${callId}`);
  }

  /**
   * Get bridge statistics
   */
  getBridgeStats(callId: string): any {
    const bridge = this.activeBridges.get(callId);
    if (!bridge) {
      return null;
    }

    return {
      callId: bridge.callId,
      rtpEndpoint: `${bridge.rtpHost}:${bridge.rtpPort}`,
      asteriskEndpoint: bridge.asteriskRtpHost 
        ? `${bridge.asteriskRtpHost}:${bridge.asteriskRtpPort}` 
        : 'unknown',
      packetsReceived: bridge.packetsReceived,
      packetsSent: bridge.packetsSent,
      bytesReceived: bridge.bytesReceived,
      bytesSent: bridge.bytesSent
    };
  }

  /**
   * Get all active bridges
   */
  getActiveBridges(): string[] {
    return Array.from(this.activeBridges.keys());
  }
}

interface AudioBridge {
  callId: string;
  rtpSocket: dgram.Socket;
  rtpPort: number;
  rtpHost: string;
  pipecatWs: WebSocket;
  asteriskRtpHost: string | null;
  asteriskRtpPort: number | null;
  sequenceNumber: number;
  timestamp: number;
  ssrc: number;
  packetsReceived: number;
  packetsSent: number;
  bytesReceived: number;
  bytesSent: number;
}

