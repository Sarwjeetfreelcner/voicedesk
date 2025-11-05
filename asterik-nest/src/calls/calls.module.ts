import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { ScheduledCall } from '../entities/scheduled-call.entity';
import { AsteriskModule } from '../asterisk/asterisk.module';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledCall]), AsteriskModule],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}
