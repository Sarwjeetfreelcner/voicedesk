import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsteriskService } from '../asterisk/asterisk.service';
import { AiConversationService } from '../ai-conversation/ai-conversation.service';
import * as WebSocket from 'ws';
import * as fs from 'fs';

/**
 * Real-time Audio Streaming Service for AI Conversations
 * Uses Asterisk Snoop + Bridge architecture for bidirectional audio
 */
@Injectable()
export class IncomingCallsStreamingService {
  private readonly logger = new Logger(IncomingCallsStreamingService.name);
  
  constructor(
    private asteriskService: AsteriskService,
    private aiConversationService: AiConversationService,
    private configService: ConfigService,
  ) {}

  /**
   * Handle AI conversation with real-time audio streaming
   * Architecture:
   * 1. Create a bridge to connect the caller
   * 2. Use Snoop channels to capture bidirectional audio
   * 3. Stream audio to/from Pipecat Agent via WebSocket
   */
  async handleAiConversation(
    channelId: string,
    callerNumber: string,
    callId: string
  ): Promise<boolean> {
    let bridge = null;
    let snoopChannel = null;
    let pipecatWs: WebSocket | null = null;
    let audioStreamInterval = null;

    try {
      this.logger.log(`Starting AI conversation with real-time streaming for call ${callId}`);

      // Step 1: Create a mixing bridge
      bridge = await this.asteriskService.createBridge('mixing');
      this.logger.log(`Created bridge: ${bridge.id}`);

      // Step 2: Add caller channel to bridge
      await this.asteriskService.addChannelToBridge(bridge.id, channelId);
      this.logger.log(`Added channel ${channelId} to bridge ${bridge.id}`);

      // Step 3: Connect to Pipecat Agent
      pipecatWs = await this.aiConversationService.startConversation(
        callId,
        callerNumber,
        channelId
      );

      if (!pipecatWs) {
        throw new Error('Failed to connect to Pipecat Agent');
      }

      this.logger.log(`Connected to Pipecat Agent for call ${callId}`);

      // Step 4: Start recording for audio capture (simple approach)
      const recordingName = `ai_call_${callId}`;
      await this.asteriskService.startRecording(channelId, recordingName, 'sln');
      
      // Step 5: Set up audio streaming from Pipecat to Asterisk
      this.setupPipecatAudioPlayback(pipecatWs, channelId);

      // Step 6: Stream recorded audio to Pipecat in chunks
      await this.streamAudioToPipecat(pipecatWs, recordingName, channelId);

      // Step 7: Monitor call status
      const monitorInterval = setInterval(async () => {
        try {
          const status = await this.asteriskService.getChannelStatus(channelId);
          if (!status || status.state === 'Down') {
            this.logger.log(`Call ${callId} ended`);
            clearInterval(monitorInterval);
            await this.cleanup(channelId, bridge?.id, recordingName, pipecatWs);
          }
        } catch (error) {
          clearInterval(monitorInterval);
          await this.cleanup(channelId, bridge?.id, recordingName, pipecatWs);
        }
      }, 2000);

      // Maximum call duration: 30 minutes
      setTimeout(async () => {
        clearInterval(monitorInterval);
        await this.cleanup(channelId, bridge?.id, recordingName, pipecatWs);
      }, 30 * 60 * 1000);

      return true;

    } catch (error) {
      this.logger.error(`Error in AI conversation: ${error.message}`);
      await this.cleanup(channelId, bridge?.id, null, pipecatWs);
      return false;
    }
  }

  /**
   * Set up playback of audio from Pipecat to Asterisk channel
   */
  private setupPipecatAudioPlayback(ws: WebSocket, channelId: string): void {
    this.aiConversationService.setupAudioListener(ws, async (audioBuffer: Buffer) => {
      try {
        // Save audio temporarily and play through Asterisk
        const tempFile = `/tmp/pipecat_${Date.now()}.sln`;
        fs.writeFileSync(tempFile, audioBuffer);
        
        this.logger.debug(`Playing AI audio: ${audioBuffer.length} bytes`);
        await this.asteriskService.playAudioFile(channelId, tempFile);
        
        // Clean up after playing
        setTimeout(() => {
          try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
          } catch (e) {}
        }, 3000);
      } catch (error) {
        this.logger.error(`Error playing Pipecat audio: ${error.message}`);
      }
    });
  }

  /**
   * Stream audio from Asterisk recording to Pipecat
   * Uses a polling approach to capture audio in real-time
   */
  private async streamAudioToPipecat(
    ws: WebSocket,
    recordingName: string,
    channelId: string
  ): Promise<void> {
    const recordingPath = `/var/spool/asterisk/recording/${recordingName}.sln`;
    let lastPosition = 0;

    // Poll the recording file for new audio data
    const streamInterval = setInterval(() => {
      try {
        if (!fs.existsSync(recordingPath)) {
          return; // Recording not started yet
        }

        const stats = fs.statSync(recordingPath);
        const currentSize = stats.size;

        if (currentSize > lastPosition) {
          // Read new audio data
          const buffer = Buffer.alloc(currentSize - lastPosition);
          const fd = fs.openSync(recordingPath, 'r');
          fs.readSync(fd, buffer, 0, buffer.length, lastPosition);
          fs.closeSync(fd);

          // Send to Pipecat
          this.aiConversationService.sendAudioToPipecat(ws, buffer, 8000);
          lastPosition = currentSize;
        }
      } catch (error) {
        this.logger.error(`Error streaming audio to Pipecat: ${error.message}`);
      }
    }, 100); // Poll every 100ms for near real-time

    // Store interval for cleanup
    (ws as any).streamInterval = streamInterval;
  }

  /**
   * Clean up resources after call ends
   */
  private async cleanup(
    channelId: string,
    bridgeId: string | null,
    recordingName: string | null,
    pipecatWs: WebSocket | null
  ): Promise<void> {
    this.logger.log(`Cleaning up resources for channel ${channelId}`);

    // Stop audio streaming
    if (pipecatWs && (pipecatWs as any).streamInterval) {
      clearInterval((pipecatWs as any).streamInterval);
    }

    // Stop recording
    if (recordingName) {
      try {
        await this.asteriskService.stopRecording(recordingName);
      } catch (e) {
        this.logger.warn(`Could not stop recording: ${e.message}`);
      }
    }

    // Close Pipecat connection
    if (pipecatWs) {
      this.aiConversationService.endConversation(pipecatWs);
    }

    // Destroy bridge
    if (bridgeId) {
      try {
        await this.asteriskService.destroyBridge(bridgeId);
      } catch (e) {
        this.logger.warn(`Could not destroy bridge: ${e.message}`);
      }
    }

    // Hangup call if still active
    try {
      await this.asteriskService.hangupCall(channelId);
    } catch (e) {
      // Channel may already be hung up
    }
  }
}

