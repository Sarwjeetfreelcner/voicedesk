import { Module } from '@nestjs/common';
import { RtpAudioBridgeService } from './rtp-audio-bridge.service';

@Module({
  providers: [RtpAudioBridgeService],
  exports: [RtpAudioBridgeService],
})
export class AudioModule {}

