import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AsteriskService {
  private readonly logger = new Logger(AsteriskService.name);
  private readonly ariUrl: string;
  private readonly ariAuth: string;

  constructor() {
    this.ariUrl = process.env.ASTERISK_ARI_URL || 'http://localhost:8088';
    this.ariAuth = Buffer.from(`${process.env.ASTERISK_ARI_USERNAME || 'asterisk'}:${process.env.ASTERISK_ARI_PASSWORD || 'asterisk'}`).toString('base64');
    this.initializeAsterisk();
  }

  private async initializeAsterisk() {
    // Skip ARI connection test during initialization
    // We'll test it when actually making calls
    this.logger.log('AsteriskService initialized - ARI connection will be tested on first call');
  }

  async makeCall(phoneNumber: string, context: string = 'from-internal'): Promise<string> {
    try {
      // Use SIP trunk for outbound calls
      const sipTrunk = process.env.SIP_TRUNK || 'voip-provider';
      const channelId = `voicedesk-${Date.now()}`;
      
      // Use ARI to originate call through dialplan
      const response = await axios.post(`${this.ariUrl}/ari/channels`, {
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
    } catch (error) {
      this.logger.error(`Failed to make call to ${phoneNumber}`, error.response?.data || error.message);
      throw error;
    }
  }

  async hangupCall(channelId: string): Promise<void> {
    try {
      await axios.delete(`${this.ariUrl}/ari/channels/${channelId}`, {
        headers: {
          'Authorization': `Basic ${this.ariAuth}`
        }
      });
      this.logger.log(`Call hung up: ${channelId}`);
    } catch (error) {
      this.logger.error(`Failed to hangup call ${channelId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async getChannelStatus(channelId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.ariUrl}/ari/channels/${channelId}`, {
        headers: {
          'Authorization': `Basic ${this.ariAuth}`
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get channel status ${channelId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async answerCall(channelId: string): Promise<void> {
    try {
      await axios.post(`${this.ariUrl}/ari/channels/${channelId}/answer`, {}, {
        headers: {
          'Authorization': `Basic ${this.ariAuth}`
        }
      });
      this.logger.log(`Call answered: ${channelId}`);
    } catch (error) {
      this.logger.error(`Failed to answer call ${channelId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async playAudioFile(channelId: string, audioFile: string): Promise<void> {
    try {
      // For built-in sounds like 'beep', use Playback
      if (audioFile === 'beep' || audioFile === 'demo-thanks' || audioFile === 'demo-congrats') {
        await this.playBuiltinSound(channelId, audioFile);
      } else {
        // For custom audio files, use Playback with full path
        await this.playCustomAudio(channelId, audioFile);
      }
    } catch (error) {
      this.logger.error(`Failed to play audio ${audioFile} on channel ${channelId}`, error.response?.data || error.message);
      throw error;
    }
  }

  private async playBuiltinSound(channelId: string, sound: string): Promise<void> {
    try {
      await axios.post(`${this.ariUrl}/ari/channels/${channelId}/play`, {
        media: `sound:${sound}`
      }, {
        headers: {
          'Authorization': `Basic ${this.ariAuth}`
        }
      });
      this.logger.log(`Playing builtin sound: ${sound}`);
    } catch (error) {
      this.logger.error(`Failed to play builtin sound ${sound}`, error.response?.data || error.message);
      throw error;
    }
  }

  private async playCustomAudio(channelId: string, audioFilePath: string): Promise<void> {
    try {
      // Extract filename from path and remove extension
      const fileName = audioFilePath.split('/').pop() || audioFilePath;
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      
      // Play via sound:voicedesk/<filename> - requires volume mount in docker-compose
      this.logger.log(`Playing custom audio: voicedesk/${nameWithoutExt}`);
      await axios.post(`${this.ariUrl}/ari/channels/${channelId}/play`, {
        media: `sound:voicedesk/${nameWithoutExt}`
      }, {
        headers: {
          'Authorization': `Basic ${this.ariAuth}`
        }
      });
    } catch (error) {
      this.logger.error(`Failed to play custom audio ${audioFilePath}`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create an external media channel for bidirectional audio streaming
   * This enables real-time audio streaming between Asterisk and external applications
   */
  async createExternalMedia(app: string, externalHost: string, format: string = 'ulaw'): Promise<any> {
    try {
      this.logger.log(`Creating external media channel: app=${app}, host=${externalHost}, format=${format}`);
      
      const response = await axios.post(
        `${this.ariUrl}/ari/channels/externalMedia`,
        null,
        {
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
        }
      );

      this.logger.log(`External media channel created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create external media channel`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Add a channel to a bridge for audio mixing
   */
  async addChannelToBridge(bridgeId: string, channelId: string, role: string = 'participant'): Promise<void> {
    try {
      await axios.post(
        `${this.ariUrl}/ari/bridges/${bridgeId}/addChannel`,
        null,
        {
          params: {
            channel: channelId,
            role: role
          },
          headers: {
            'Authorization': `Basic ${this.ariAuth}`
          }
        }
      );
      this.logger.log(`Added channel ${channelId} to bridge ${bridgeId} with role ${role}`);
    } catch (error) {
      this.logger.error(`Failed to add channel to bridge`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a mixing bridge for connecting channels
   */
  async createBridge(bridgeType: string = 'mixing'): Promise<any> {
    try {
      const response = await axios.post(
        `${this.ariUrl}/ari/bridges`,
        null,
        {
          params: {
            type: bridgeType
          },
          headers: {
            'Authorization': `Basic ${this.ariAuth}`
          }
        }
      );
      this.logger.log(`Bridge created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create bridge`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Destroy a bridge
   */
  async destroyBridge(bridgeId: string): Promise<void> {
    try {
      await axios.delete(`${this.ariUrl}/ari/bridges/${bridgeId}`, {
        headers: {
          'Authorization': `Basic ${this.ariAuth}`
        }
      });
      this.logger.log(`Bridge destroyed: ${bridgeId}`);
    } catch (error) {
      this.logger.error(`Failed to destroy bridge ${bridgeId}`, error.response?.data || error.message);
    }
  }

  /**
   * Start recording a channel (for audio capture)
   */
  async startRecording(channelId: string, name: string, format: string = 'wav'): Promise<any> {
    try {
      const response = await axios.post(
        `${this.ariUrl}/ari/channels/${channelId}/record`,
        null,
        {
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
        }
      );
      this.logger.log(`Started recording on channel ${channelId}: ${name}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to start recording on ${channelId}`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(recordingName: string): Promise<void> {
    try {
      await axios.post(
        `${this.ariUrl}/ari/recordings/live/${recordingName}/stop`,
        null,
        {
          headers: {
            'Authorization': `Basic ${this.ariAuth}`
          }
        }
      );
      this.logger.log(`Stopped recording: ${recordingName}`);
    } catch (error) {
      this.logger.error(`Failed to stop recording ${recordingName}`, error.response?.data || error.message);
    }
  }

  /**
   * Create a Snoop channel for monitoring audio on a channel
   * This allows capturing both directions of audio in real-time
   */
  async createSnoopChannel(
    channelId: string,
    app: string,
    spy: string = 'both',
    whisper: string = 'none'
  ): Promise<any> {
    try {
      const snoopId = `snoop-${Date.now()}`;
      
      const response = await axios.post(
        `${this.ariUrl}/ari/channels/${channelId}/snoop/${snoopId}`,
        null,
        {
          params: {
            app: app,
            spy: spy,
            whisper: whisper
          },
          headers: {
            'Authorization': `Basic ${this.ariAuth}`
          }
        }
      );

      this.logger.log(`Snoop channel created: ${response.data.id} for ${channelId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create snoop channel for ${channelId}`, error.response?.data || error.message);
      throw error;
    }
  }
}
