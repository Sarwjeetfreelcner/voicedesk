import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as WebSocket from 'ws';

/**
 * AI Conversation Service - Integrates with Pipecat Agent for real-time AI conversations
 * This is an OPTIONAL service that can be enabled via environment variable
 */
@Injectable()
export class AiConversationService {
  private readonly logger = new Logger(AiConversationService.name);
  private readonly pipecatUrl: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.pipecatUrl = this.configService.get<string>('PIPECAT_AGENT_URL', 'ws://pipecat-agent:8080');
    this.enabled = this.configService.get<string>('ENABLE_AI_CONVERSATION', 'false') === 'true';
    
    if (this.enabled) {
      this.logger.log('AI Conversation Service ENABLED - will connect to Pipecat Agent');
    } else {
      this.logger.log('AI Conversation Service DISABLED - using fallback audio');
    }
  }

  /**
   * Check if AI conversation is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start AI conversation for a call
   * Returns WebSocket connection or null if disabled/failed
   */
  async startConversation(callId: string, callerNumber: string, channelId: string): Promise<WebSocket | null> {
    if (!this.enabled) {
      this.logger.log('AI conversation disabled, skipping');
      return null;
    }

    try {
      const wsUrl = `${this.pipecatUrl}/ws/asterisk`;
      this.logger.log(`Connecting to Pipecat Agent: ${wsUrl} for call ${callId}`);

      const ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.logger.error('Pipecat connection timeout');
          ws.close();
          reject(new Error('Connection timeout'));
        }, 10000); // 10 second timeout

        ws.on('open', () => {
          clearTimeout(timeout);
          this.logger.log(`Connected to Pipecat Agent for call ${callId}`);

          // Send initial connection data
          const initialData = {
            call_id: callId,
            caller_number: callerNumber,
            channel_id: channelId,
            timestamp: new Date().toISOString()
          };

          ws.send(JSON.stringify(initialData));
          this.logger.log(`Sent initial data to Pipecat: ${JSON.stringify(initialData)}`);
          resolve(ws);
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          this.logger.error(`Pipecat WebSocket error: ${error.message}`);
          reject(error);
        });

        ws.on('close', (code, reason) => {
          this.logger.log(`Pipecat WebSocket closed: ${code} - ${reason}`);
        });
      });
    } catch (error) {
      this.logger.error(`Failed to connect to Pipecat Agent: ${error.message}`);
      return null;
    }
  }

  /**
   * Send audio data to Pipecat Agent
   */
  async sendAudioToPipecat(ws: WebSocket, audioData: Buffer, sampleRate: number = 8000): Promise<void> {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      this.logger.warn(`❌ WebSocket not open (state: ${ws?.readyState}), cannot send audio`);
      return;
    }

    try {
      this.logger.log(`🎤 Preparing to send audio: ${audioData.length} bytes, ${sampleRate}Hz`);
      
      const audioMessage = {
        type: 'audio',
        audio: audioData.toString('base64'),
        sample_rate: sampleRate,
        num_channels: 1,
        timestamp: new Date().toISOString()
      };

      const jsonMessage = JSON.stringify(audioMessage);
      this.logger.log(`📡 Sending WebSocket message: ${jsonMessage.length} chars`);
      
      ws.send(jsonMessage);
      this.logger.log(`✅ Sent audio data to Pipecat: ${audioData.length} bytes`);
    } catch (error) {
      this.logger.error(`❌ Failed to send audio to Pipecat: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
    }
  }

  /**
   * Handle incoming audio from Pipecat Agent
   */
  setupAudioListener(ws: WebSocket, onAudio: (audioBuffer: Buffer) => void): void {
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'audio' && message.audio) {
          const audioBuffer = Buffer.from(message.audio, 'base64');
          this.logger.debug(`Received audio from Pipecat: ${audioBuffer.length} bytes`);
          onAudio(audioBuffer);
        } else if (message.type === 'event') {
          this.logger.log(`Pipecat event: ${message.event}`);
        }
      } catch (error) {
        this.logger.error(`Error processing Pipecat message: ${error.message}`);
      }
    });
  }

  /**
   * End AI conversation
   */
  endConversation(ws: WebSocket | null): void {
    if (ws && ws.readyState === WebSocket.OPEN) {
      this.logger.log('Ending AI conversation');
      try {
        ws.send(JSON.stringify({ type: 'end_call' }));
        ws.close();
      } catch (error) {
        this.logger.error(`Error closing WebSocket: ${error.message}`);
      }
    }
  }

  /**
   * Monitor WebSocket connection health
   */
  monitorConnection(ws: WebSocket, callId: string, onDisconnect: () => void): void {
    ws.on('close', () => {
      this.logger.log(`WebSocket closed for call ${callId}`);
      onDisconnect();
    });

    ws.on('error', (error) => {
      this.logger.error(`WebSocket error for call ${callId}: ${error.message}`);
      onDisconnect();
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // Every 30 seconds
  }
}

