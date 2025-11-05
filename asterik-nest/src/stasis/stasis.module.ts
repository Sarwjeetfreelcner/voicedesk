import { Module } from '@nestjs/common';
import { StasisService } from './stasis.service';
import { IncomingCallsModule } from '../incoming-calls/incoming-calls.module';

@Module({
  imports: [IncomingCallsModule],
  providers: [StasisService],
  exports: [StasisService],
})
export class StasisModule {}
