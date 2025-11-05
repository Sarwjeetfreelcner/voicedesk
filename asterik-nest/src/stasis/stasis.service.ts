import { Injectable, Logger } from '@nestjs/common';
import { IncomingCallsService } from '../incoming-calls/incoming-calls.service';

@Injectable()
export class StasisService {
  private readonly logger = new Logger(StasisService.name);

  constructor(
    private readonly incomingCallsService: IncomingCallsService,
  ) {}

  /**
   * Handle Stasis application events
   */
  async handleStasisEvent(event: any): Promise<void> {
    this.logger.log(`Received Stasis event: ${event.type}`);

    switch (event.type) {
      case 'StasisStart':
        await this.handleStasisStart(event);
        break;
      case 'StasisEnd':
        await this.handleStasisEnd(event);
        break;
      case 'ChannelDestroyed':
        await this.handleChannelDestroyed(event);
        break;
      default:
        this.logger.debug(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle StasisStart event - when a call enters the Stasis application
   */
  private async handleStasisStart(event: any): Promise<void> {
    try {
      const channelId = event.channel.id;
      const callerNumber = event.args?.[0] || 'Unknown';
      
      this.logger.log(`StasisStart - Channel: ${channelId}, Caller: ${callerNumber}`);

      // Handle the incoming call with TTS
      await this.incomingCallsService.handleIncomingCall(callerNumber, channelId);

    } catch (error) {
      this.logger.error('Error handling StasisStart:', error.message);
    }
  }

  /**
   * Handle StasisEnd event - when a call leaves the Stasis application
   */
  private async handleStasisEnd(event: any): Promise<void> {
    this.logger.log(`StasisEnd - Channel: ${event.channel?.id}`);
  }

  /**
   * Handle ChannelDestroyed event - when a channel is destroyed
   */
  private async handleChannelDestroyed(event: any): Promise<void> {
    this.logger.log(`ChannelDestroyed - Channel: ${event.channel?.id}`);
  }
}

