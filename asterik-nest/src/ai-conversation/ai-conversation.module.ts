import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiConversationService } from './ai-conversation.service';

@Module({
  imports: [ConfigModule],
  providers: [AiConversationService],
  exports: [AiConversationService],
})
export class AiConversationModule {}

