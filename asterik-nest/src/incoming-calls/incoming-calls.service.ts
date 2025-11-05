import { Injectable, Logger } from '@nestjs/common';
import { TtsService } from '../tts/tts.service';
import { AsteriskService } from '../asterisk/asterisk.service';
import { AiConversationService } from '../ai-conversation/ai-conversation.service';
import { RtpAudioBridgeService } from '../audio/rtp-audio-bridge.service';
import * as fs from 'fs';
import * as path from 'path';
import * as WebSocket from 'ws';

@Injectable()
export class IncomingCallsService {
  private readonly logger = new Logger(IncomingCallsService.name);

  constructor(
    private readonly ttsService: TtsService,
    private readonly asteriskService: AsteriskService,
    private readonly aiConversationService: AiConversationService,
    private readonly rtpAudioBridge: RtpAudioBridgeService,
  ) {}

  /**
   * Handle incoming call to DDI number
   */
  async handleIncomingCall(callerNumber: string, channelId: string): Promise<void> {
    try {
      // IGNORE snoop channels completely - don't process them
      if (channelId.startsWith('snoop-')) {
        this.logger.debug(`Ignoring snoop channel: ${channelId}`);
        return;
      }

      // IGNORE External Media channels - they are internal system channels managed by AI call flow
      // External Media channels have "Unknown" caller and are created programmatically
      if (callerNumber === 'Unknown' || channelId.includes('.1') || channelId.includes('.2')) {
        this.logger.debug(`🚫 Ignoring External Media/system channel: ${channelId} (caller: ${callerNumber})`);
        return;
      }

      this.logger.log(`Handling incoming call from ${callerNumber} on channel ${channelId}`);

      // Answer the call
      await this.asteriskService.answerCall(channelId);
      this.logger.log('Call answered successfully');

      // Wait a moment
      await this.sleep(1000);

      // TRY AI CONVERSATION FIRST (if enabled)
      if (this.aiConversationService.isEnabled()) {
        this.logger.log('AI Conversation is enabled - connecting to Pipecat for greeting');
        
        // For now, just connect and let Pipecat say its greeting
        // We'll keep the connection open so you can hear the AI
        const success = await this.handleSimpleAiGreeting(callerNumber, channelId);
        
        if (success) {
          this.logger.log('AI greeting completed');
          return;
        } else {
          this.logger.warn('AI greeting failed - falling back to static audio');
        }
      }

      // FALLBACK: Play static audio
      this.logger.log('Playing fallback audio');
      await this.asteriskService.playAudioFile(channelId, '/app/audio/intro_1760256231995_8k.wav');
      await this.sleep(10000);
      await this.asteriskService.hangupCall(channelId);
      this.logger.log('Call completed');

    } catch (error) {
      this.logger.error('Error handling incoming call:', error.message);
      try {
        await this.asteriskService.hangupCall(channelId);
      } catch (e) {}
    }
  }

  /**
   * Handle AI conversation with External Media (RTP) for bidirectional audio
   * This is the PROPER real-time solution
   */
  private async handleSimpleAiGreeting(callerNumber: string, channelId: string): Promise<boolean> {
    let ws: WebSocket | null = null;
    let bridge = null;
    let externalMediaChannel = null;
    const callId = `call_${Date.now()}_${channelId}`;
    
    try {
      this.logger.log(`🚀 [AI Call] Starting AI conversation with External Media for ${callId}`);
      this.logger.log(`[AI Call] Caller: ${callerNumber}, Channel: ${channelId}`);
      
      // Step 1: Connect to Pipecat
      this.logger.log(`[AI Call] Step 1/7: Connecting to Pipecat Agent...`);
      ws = await this.aiConversationService.startConversation(callId, callerNumber, channelId);
      
      if (!ws) {
        this.logger.error(`❌ [AI Call] Failed to connect to Pipecat - aborting`);
        return false;
      }

      this.logger.log(`✅ [AI Call] Step 1/7 Complete: Connected to Pipecat for call ${callId}`);

      // Step 2: Create RTP audio bridge
      this.logger.log(`[AI Call] Step 2/7: Creating RTP audio bridge...`);
      const { rtpPort, rtpHost } = await this.rtpAudioBridge.createBridge(callId, ws);
      this.logger.log(`✅ [AI Call] Step 2/7 Complete: RTP bridge created at ${rtpHost}:${rtpPort}`);

      // Step 3: Create a mixing bridge in Asterisk
      this.logger.log(`[AI Call] Step 3/7: Creating Asterisk mixing bridge...`);
      bridge = await this.asteriskService.createBridge('mixing');
      this.logger.log(`✅ [AI Call] Step 3/7 Complete: Asterisk bridge created with ID: ${bridge.id}`);

      // Step 4: Add caller channel to bridge
      this.logger.log(`[AI Call] Step 4/7: Adding caller channel ${channelId} to bridge...`);
      await this.asteriskService.addChannelToBridge(bridge.id, channelId);
      this.logger.log(`✅ [AI Call] Step 4/7 Complete: Caller channel added to bridge`);

      // Step 5: Create External Media channel (connects to our RTP bridge)
      this.logger.log(`[AI Call] Step 5/7: Creating External Media channel...`);
      const externalHost = `${rtpHost}:${rtpPort}`;
      this.logger.log(`[AI Call] External Media will connect to: ${externalHost}`);
      externalMediaChannel = await this.asteriskService.createExternalMedia(
        'voicedesk',
        externalHost,
        'ulaw'  // µ-law codec (we handle conversion in RTP bridge)
      );
      this.logger.log(`✅ [AI Call] Step 5/7 Complete: External Media channel created with ID: ${externalMediaChannel.id}`);

      // Step 6: Wait for External Media channel to be ready, then add to bridge
      this.logger.log(`[AI Call] Step 6/7: Waiting for External Media channel to be ready...`);
      
      // Give External Media a moment to establish connection
      await this.sleep(500);
      
      this.logger.log(`[AI Call] Adding External Media channel ${externalMediaChannel.id} to bridge...`);
      await this.asteriskService.addChannelToBridge(bridge.id, externalMediaChannel.id);
      this.logger.log(`✅ [AI Call] Step 6/7 Complete: External Media added to bridge`);
      this.logger.log(`🎉 [AI Call] *** AUDIO PIPELINE READY - AUDIO SHOULD NOW BE FLOWING! ***`);
      this.logger.log(`📋 [AI Call] Pipeline: Caller (${channelId}) ↔ Bridge (${bridge.id}) ↔ External Media (${externalMediaChannel.id}) ↔ RTP (${rtpHost}:${rtpPort}) ↔ Pipecat`);

      // Step 7: Monitor call and keep it alive
      this.logger.log(`[AI Call] Step 7/7: Monitoring call... (max 10 minutes)`);
      this.logger.log(`✅ [AI Call] Step 7/7 Complete: Call monitoring started`);
      this.logger.log(`📞 [AI Call] AI conversation is now active - speak to the AI!`);
      
      let monitoringReason = 'unknown';
      
      await new Promise((resolve) => {
        const checkInterval = setInterval(async () => {
          try {
            await this.asteriskService.getChannelStatus(channelId);
          } catch (error) {
            // Channel ended
            this.logger.log(`[AI Call] Channel ${channelId} ended (caller hung up)`);
            monitoringReason = 'caller_hangup';
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 1000);
        
        // Also end if WebSocket closes
        ws.on('close', () => {
          this.logger.log(`[AI Call] Pipecat WebSocket closed`);
          monitoringReason = 'websocket_closed';
          clearInterval(checkInterval);
          resolve(null);
        });

        // Max duration: 10 minutes
        setTimeout(() => {
          this.logger.log(`[AI Call] Maximum call duration reached (10 minutes)`);
          monitoringReason = 'timeout';
          clearInterval(checkInterval);
          resolve(null);
        }, 10 * 60 * 1000);
      });

      this.logger.log(`📴 [AI Call] AI conversation ended for ${callId} (reason: ${monitoringReason})`);
      
      // Cleanup
      this.logger.log(`[AI Call] Starting cleanup process...`);
      await this.cleanup(callId, bridge, externalMediaChannel, ws);
      
      // Hangup
      this.logger.log(`[AI Call] Hanging up caller channel...`);
      try {
        await this.asteriskService.hangupCall(channelId);
        this.logger.log(`✅ [AI Call] Caller channel hung up successfully`);
      } catch (e) {
        this.logger.debug(`[AI Call] Channel already hung up or not found`);
      }

      this.logger.log(`✅ [AI Call] AI conversation completed successfully for ${callId}`);
      return true;
      
    } catch (error) {
      this.logger.error(`❌ [AI Call] Error in AI conversation: ${error.message}`);
      this.logger.error(`[AI Call] Error stack: ${error.stack}`);
      
      // Cleanup on error
      this.logger.log(`[AI Call] Starting error cleanup...`);
      await this.cleanup(callId, bridge, externalMediaChannel, ws);
      
      return false;
    }
  }

  /**
   * Clean up all resources for a call
   */
  private async cleanup(
    callId: string,
    bridge: any,
    externalMediaChannel: any,
    ws: WebSocket | null
  ): Promise<void> {
    this.logger.log(`🧹 [Cleanup] Starting cleanup for ${callId}`);

    // Destroy RTP bridge
    this.logger.debug(`[Cleanup] Step 1/4: Destroying RTP bridge...`);
    try {
      await this.rtpAudioBridge.destroyBridge(callId);
      this.logger.log(`✅ [Cleanup] RTP bridge destroyed`);
    } catch (e) {
      this.logger.warn(`⚠️ [Cleanup] Error destroying RTP bridge: ${e.message}`);
    }

    // Close Pipecat connection
    this.logger.debug(`[Cleanup] Step 2/4: Closing Pipecat connection...`);
    if (ws) {
      try {
        this.aiConversationService.endConversation(ws);
        this.logger.log(`✅ [Cleanup] Pipecat connection closed`);
      } catch (e) {
        this.logger.warn(`⚠️ [Cleanup] Error ending Pipecat conversation: ${e.message}`);
      }
    } else {
      this.logger.debug(`[Cleanup] No Pipecat connection to close`);
    }

    // Hangup external media channel
    this.logger.debug(`[Cleanup] Step 3/4: Hanging up external media channel...`);
    if (externalMediaChannel) {
      try {
        await this.asteriskService.hangupCall(externalMediaChannel.id);
        this.logger.log(`✅ [Cleanup] External media channel hung up`);
      } catch (e) {
        this.logger.warn(`⚠️ [Cleanup] Error hanging up external media: ${e.message}`);
      }
    } else {
      this.logger.debug(`[Cleanup] No external media channel to hang up`);
    }

    // Destroy Asterisk bridge
    this.logger.debug(`[Cleanup] Step 4/4: Destroying Asterisk bridge...`);
    if (bridge) {
      try {
        await this.asteriskService.destroyBridge(bridge.id);
        this.logger.log(`✅ [Cleanup] Asterisk bridge destroyed`);
      } catch (e) {
        this.logger.warn(`⚠️ [Cleanup] Error destroying Asterisk bridge: ${e.message}`);
      }
    } else {
      this.logger.debug(`[Cleanup] No Asterisk bridge to destroy`);
    }

    this.logger.log(`✅ [Cleanup] All cleanup completed for ${callId}`);
  }

  /**
   * Handle AI conversation using Pipecat Agent
   * Returns true if successful, false if failed (will fallback to static audio)
   */
  private async handleAiConversation(callerNumber: string, channelId: string): Promise<boolean> {
    let ws: WebSocket | null = null;
    
    try {
      const callId = `call_${Date.now()}_${channelId}`;
      
      // Connect to Pipecat Agent
      ws = await this.aiConversationService.startConversation(callId, callerNumber, channelId);
      
      if (!ws) {
        this.logger.warn('Failed to establish WebSocket connection to Pipecat');
        return false;
      }

      this.logger.log(`AI conversation started for call ${callId}`);

      // START AUDIO STREAMING FROM ASTERISK TO PIPECAT
      // Create a snoop channel to capture audio in real-time
      const snoopChannel = await this.asteriskService.createSnoopChannel(
        channelId,
        'voicedesk',
        'both', // Capture both directions
        'none'
      );
      
      this.logger.log(`Snoop channel created: ${snoopChannel.id}`);

      // Start recording the snoop channel to capture audio
      const recordingName = `snoop_${callId}`;
      await this.asteriskService.startRecording(snoopChannel.id, recordingName, 'sln');
      this.logger.log(`Started recording: ${recordingName}`);

      // Stream audio from recording to Pipecat in real-time
      this.streamAudioToPipecat(ws, recordingName, channelId);

      // Set up audio listener to receive AI responses from Pipecat
      let audioChunkCount = 0;
      this.aiConversationService.setupAudioListener(ws, async (audioBuffer: Buffer) => {
        try {
          audioChunkCount++;
          this.logger.log(`🔊 Received audio from Pipecat: chunk #${audioChunkCount}, ${audioBuffer.length} bytes`);
          
          // TODO: For now, just log that we received it
          // Proper implementation would stream this back to the channel in real-time
          // via External Media or AudioSocket
          
          this.logger.warn(`⚠️ Audio playback via file not implemented yet - need real-time streaming`);
        } catch (error) {
          this.logger.error(`Error handling audio from Pipecat: ${error.message}`);
        }
      });

      // Cleanup function to stop all resources
      const cleanup = async () => {
        this.logger.log(`Cleaning up AI conversation for ${callId}`);
        
        // Stop audio streaming
        if ((ws as any).audioStreamInterval) {
          clearInterval((ws as any).audioStreamInterval);
        }
        
        // Stop recording
        try {
          await this.asteriskService.stopRecording(recordingName);
        } catch (e) {}
        
        // Hangup snoop channel
        try {
          await this.asteriskService.hangupCall(snoopChannel.id);
        } catch (e) {}
        
        // Close Pipecat connection
        this.aiConversationService.endConversation(ws);
      };

      // Monitor call status and end AI conversation when call ends
      const monitorInterval = setInterval(async () => {
        try {
          const status = await this.asteriskService.getChannelStatus(channelId);
          if (!status || status.state === 'Down' || status.state === 'Hangup') {
            this.logger.log(`Call ${callId} ended - stopping AI conversation`);
            clearInterval(monitorInterval);
            await cleanup();
          }
        } catch (error) {
          // Channel no longer exists - call ended
          clearInterval(monitorInterval);
          await cleanup();
        }
      }, 2000);

      // Set max call duration (10 minutes)
      setTimeout(async () => {
        this.logger.log(`Max call duration reached for ${callId}`);
        clearInterval(monitorInterval);
        await cleanup();
        this.asteriskService.hangupCall(channelId).catch(() => {});
      }, 10 * 60 * 1000);

      // Monitor connection health
      this.aiConversationService.monitorConnection(ws, callId, async () => {
        clearInterval(monitorInterval);
        await cleanup();
      });

      return true; // AI conversation setup successful
      
    } catch (error) {
      this.logger.error(`Error in AI conversation: ${error.message}`);
      if (ws) {
        this.aiConversationService.endConversation(ws);
      }
      return false; // AI failed, will fallback
    }
  }

  /**
   * Play intro message using TTS
   */
  private async playIntroMessage(callerNumber: string, channelId: string): Promise<void> {
    try {
      this.logger.log('Generating intro message...');
      
      // Create intro audio
      const audioFilePath = await this.ttsService.createIntroAudio(callerNumber);
      
      if (audioFilePath && fs.existsSync(audioFilePath)) {
        this.logger.log(`TTS audio generated successfully: ${audioFilePath}`);

        // Wait a moment for file to sync to volume mount
        await this.sleep(500);

        this.logger.log('Playing generated audio file');
        
        // Play the generated audio file
        await this.asteriskService.playAudioFile(channelId, audioFilePath);
        
        // Clean up the audio file after playing
        setTimeout(() => {
          try {
            fs.unlinkSync(audioFilePath);
            this.logger.log(`Cleaned up audio file: ${audioFilePath}`);
          } catch (cleanupError) {
            this.logger.warn(`Could not clean up audio file: ${cleanupError.message}`);
          }
        }, 5000);
        
      } else {
        this.logger.warn('Audio file not found, playing default beep');
        await this.playDefaultBeeps(channelId);
      }

    } catch (error) {
      this.logger.error('Error playing intro message:', error.message);
      
      // Fallback to default beeps
      await this.playDefaultBeeps(channelId);
    }
  }

  /**
   * Play default beeps as fallback
   */
  private async playDefaultBeeps(channelId: string): Promise<void> {
    try {
      this.logger.log('Playing default beeps...');
      
      // Play 3 beeps with pauses
      await this.asteriskService.playAudioFile(channelId, 'beep');
      await this.sleep(2000);
      await this.asteriskService.playAudioFile(channelId, 'beep');
      await this.sleep(1000);
      await this.asteriskService.playAudioFile(channelId, 'beep');
      
    } catch (error) {
      this.logger.error('Error playing default beeps:', error.message);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stream audio from Asterisk recording to Pipecat in real-time
   * This polls the recording file and sends new audio chunks as they're written
   */
  private streamAudioToPipecat(ws: WebSocket, recordingName: string, channelId: string): void {
    const recordingPath = `/var/spool/asterisk/recording/${recordingName}.sln`;
    let lastPosition = 0;
    let streamActive = true;
    let pollCount = 0;
    let totalBytesSent = 0;

    this.logger.log(`Starting audio stream from ${recordingPath} to Pipecat`);
    this.logger.log(`WebSocket ready state: ${ws.readyState} (1=OPEN)`);

    // Poll the recording file for new audio data every 50ms (20 times per second)
    const streamInterval = setInterval(() => {
      pollCount++;
      
      if (!streamActive || ws.readyState !== WebSocket.OPEN) {
        this.logger.warn(`Stopping audio stream: streamActive=${streamActive}, wsState=${ws.readyState}`);
        clearInterval(streamInterval);
        return;
      }

      try {
        // Check if recording file exists yet
        if (!fs.existsSync(recordingPath)) {
          if (pollCount % 20 === 0) { // Log every second
            this.logger.debug(`Waiting for recording file: ${recordingPath} (poll ${pollCount})`);
          }
          return;
        }

        const stats = fs.statSync(recordingPath);
        const currentSize = stats.size;

        // Log file info periodically
        if (pollCount % 20 === 0) { // Every second
          this.logger.log(`Recording file status: size=${currentSize}, lastPos=${lastPosition}, polls=${pollCount}`);
        }

        // If there's new audio data
        if (currentSize > lastPosition) {
          const newDataSize = currentSize - lastPosition;
          const buffer = Buffer.alloc(newDataSize);
          
          // Read the new audio data
          const fd = fs.openSync(recordingPath, 'r');
          fs.readSync(fd, buffer, 0, newDataSize, lastPosition);
          fs.closeSync(fd);

          // Send to Pipecat (8kHz signed linear PCM)
          this.logger.log(`📤 Sending ${newDataSize} bytes of audio to Pipecat (total sent: ${totalBytesSent + newDataSize})`);
          this.aiConversationService.sendAudioToPipecat(ws, buffer, 8000);
          
          totalBytesSent += newDataSize;
          lastPosition = currentSize;
          
          this.logger.log(`✅ Audio sent successfully. Total: ${totalBytesSent} bytes`);
        }
      } catch (error) {
        this.logger.error(`❌ Error streaming audio to Pipecat: ${error.message}`);
        this.logger.error(`Stack: ${error.stack}`);
      }
    }, 50); // Poll every 50ms for near-real-time streaming

    // Store the interval on the WebSocket for cleanup
    (ws as any).audioStreamInterval = streamInterval;

    // Stop streaming when WebSocket closes
    ws.on('close', () => {
      streamActive = false;
      clearInterval(streamInterval);
      this.logger.log(`Audio streaming stopped (WebSocket closed). Total bytes sent: ${totalBytesSent}`);
    });
  }
}
