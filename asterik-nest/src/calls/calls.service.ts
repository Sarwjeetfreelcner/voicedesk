import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ScheduledCall } from "../entities/scheduled-call.entity";
import { AsteriskService } from "../asterisk/asterisk.service";

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    @InjectRepository(ScheduledCall)
    private scheduledCallRepository: Repository<ScheduledCall>,
    private asteriskService: AsteriskService
  ) {}

  async scheduleCall(
    phoneNumber: string,
    scheduledTime: Date,
    notes?: string
  ): Promise<ScheduledCall> {
    const scheduledCall = this.scheduledCallRepository.create({
      phoneNumber,
      scheduledTime,
      notes,
      status: "pending",
    });

    return await this.scheduledCallRepository.save(scheduledCall);
  }

  async getAllScheduledCalls(): Promise<ScheduledCall[]> {
    return await this.scheduledCallRepository.find({
      order: { scheduledTime: "ASC" },
    });
  }

  async getScheduledCallById(id: number): Promise<ScheduledCall> {
    return await this.scheduledCallRepository.findOne({ where: { id } });
  }

  async cancelCall(id: number): Promise<void> {
    const call = await this.scheduledCallRepository.findOne({ where: { id } });
    if (call && call.status === "pending") {
      call.status = "cancelled";
      await this.scheduledCallRepository.save(call);
    }
  }

  async updateCallStatus(
    id: number,
    status: ScheduledCall["status"],
    callId?: string,
    errorMessage?: string
  ): Promise<void> {
    const call = await this.scheduledCallRepository.findOne({ where: { id } });
    if (call) {
      call.status = status;
      if (callId) call.callId = callId;
      if (errorMessage) call.errorMessage = errorMessage;
      await this.scheduledCallRepository.save(call);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledCalls() {
    const now = new Date();
    const pendingCalls = await this.scheduledCallRepository.find({
      where: {
        status: "pending",
      },
    });

    for (const call of pendingCalls) {
      if (call.scheduledTime <= now) {
        await this.executeCall(call);
      }
    }
  }

  private async executeCall(call: ScheduledCall) {
    try {
      this.logger.log(`Executing scheduled call to ${call.phoneNumber}`);

      await this.updateCallStatus(call.id, "in_progress");

      const callId = await this.asteriskService.makeCall(call.phoneNumber);

      await this.updateCallStatus(call.id, "in_progress", callId);

      // Simulate call duration - in real implementation, you'd monitor the call status
      setTimeout(async () => {
        try {
          await this.asteriskService.hangupCall(callId);
          await this.updateCallStatus(call.id, "completed");
          this.logger.log(`Call completed: ${call.phoneNumber}`);
        } catch (error) {
          this.logger.error(`Error ending call ${callId}`, error);
          await this.updateCallStatus(
            call.id,
            "failed",
            undefined,
            error.message
          );
        }
      }, 30000); // 30 seconds call duration
    } catch (error) {
      this.logger.error(`Failed to execute call to ${call.phoneNumber}`, error);
      await this.updateCallStatus(call.id, "failed", undefined, error.message);
    }
  }
}
