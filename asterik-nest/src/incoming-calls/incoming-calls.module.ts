import { Module } from '@nestjs/common';
import { IncomingCallsService } from './incoming-calls.service';
import { TtsModule } from '../tts/tts.module';
import { AsteriskModule } from '../asterisk/asterisk.module';
import { AiConversationModule } from '../ai-conversation/ai-conversation.module';
import { AudioModule } from '../audio/audio.module';

@Module({
  imports: [TtsModule, AsteriskModule, AiConversationModule, AudioModule],
  providers: [IncomingCallsService],
  exports: [IncomingCallsService],
})
export class IncomingCallsModule {}
