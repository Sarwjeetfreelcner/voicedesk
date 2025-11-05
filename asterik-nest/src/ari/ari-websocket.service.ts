import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StasisService } from '../stasis/stasis.service';
import * as WebSocket from 'ws';
import axios from 'axios';

@Injectable()
export class AriWebSocketService implements OnModuleInit {
  private readonly logger = new Logger(AriWebSocketService.name);
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private readonly maxReconnectAttempts = 10;
  private reconnectAttempts = 0;
  private readonly ariUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly stasisService: StasisService,
  ) {
    // Initialize with correct credentials
    this.ariUrl = this.configService.get<string>('ASTERISK_ARI_URL', 'http://localhost:8088');
    this.username = this.configService.get<string>('ASTERISK_ARI_USERNAME', 'voicedesk');
    this.password = this.configService.get<string>('ASTERISK_ARI_PASSWORD', 'voicedesk');
  }

  async onModuleInit() {
    // Wait a bit for Asterisk to be ready
    this.logger.log('ARI WebSocket service initializing...');
    setTimeout(() => {
      this.connect();
    }, 5000);
  }

  private async connect(): Promise<void> {
    try {
      const apiKey = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      const wsUrl = this.ariUrl.replace('http', 'ws') + `/ari/events?api_key=${apiKey}&app=voicedesk`;

      this.logger.log(`Connecting to ARI WebSocket: ${wsUrl}`);
      this.logger.log(`API Key: ${apiKey}`);

      this.ws = new WebSocket(wsUrl, {
        headers: {
          'Authorization': `Basic ${apiKey}`
        }
      });

      this.ws.on('open', () => {
        this.logger.log('ARI WebSocket connected successfully');
        this.reconnectAttempts = 0;
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString());
          this.handleAriEvent(event);
        } catch (error) {
          this.logger.error('Error parsing ARI event:', error.message);
        }
      });

      this.ws.on('error', (error) => {
        this.logger.error('ARI WebSocket error:', error.message);
      });

      this.ws.on('close', (code, reason) => {
        this.logger.warn(`ARI WebSocket closed: ${code} - ${reason}`);
        this.scheduleReconnect();
      });

    } catch (error) {
      this.logger.error('Failed to connect to ARI WebSocket:', error.message);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached. Stopping reconnection attempts.');
      return;
    }

    if (this.reconnectInterval) {
      return; // Already scheduled
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.logger.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null;
      this.connect();
    }, delay);
  }

  private async handleAriEvent(event: any): Promise<void> {
    try {
      // Only handle events for our application
      if (event.application !== 'voicedesk') {
        return;
      }

      this.logger.debug(`Handling ARI event: ${event.type}`);

      // Handle Stasis events
      if (event.type.startsWith('Stasis')) {
        await this.stasisService.handleStasisEvent(event);
      }

    } catch (error) {
      this.logger.error('Error handling ARI event:', error.message);
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
