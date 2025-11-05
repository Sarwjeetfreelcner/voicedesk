import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AriWebSocketService } from './ari-websocket.service';
import { StasisModule } from '../stasis/stasis.module';

@Module({
  imports: [ConfigModule, StasisModule],
  providers: [AriWebSocketService],
  exports: [AriWebSocketService],
})
export class AriModule {}
