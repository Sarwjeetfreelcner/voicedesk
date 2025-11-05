import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CallsModule } from './calls/calls.module';
import { AsteriskModule } from './asterisk/asterisk.module';
import { TtsModule } from './tts/tts.module';
import { IncomingCallsModule } from './incoming-calls/incoming-calls.module';
import { StasisModule } from './stasis/stasis.module';
import { AriModule } from './ari/ari.module';
import { ScheduledCall } from './entities/scheduled-call.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'voicedesk.db',
      entities: [ScheduledCall],
      synchronize: true, // Only for development
    }),
    CallsModule,
    AsteriskModule,
    TtsModule,
    IncomingCallsModule,
    StasisModule,
    AriModule,
  ],
})
export class AppModule {}
