import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
} from "@nestjs/common";
import { CallsService } from "./calls.service";
import { ScheduledCall } from "../entities/scheduled-call.entity";

export class ScheduleCallDto {
  phoneNumber: string;
  scheduledTime: string; // ISO string
  notes?: string;
}

@Controller("calls")
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post("schedule")
  async scheduleCall(
    @Body() scheduleCallDto: ScheduleCallDto
  ): Promise<ScheduledCall> {
    const scheduledTime = new Date(scheduleCallDto.scheduledTime);
    return await this.callsService.scheduleCall(
      scheduleCallDto.phoneNumber,
      scheduledTime,
      scheduleCallDto.notes
    );
  }

  @Get()
  async getAllCalls(): Promise<ScheduledCall[]> {
    return await this.callsService.getAllScheduledCalls();
  }

  @Get(":id")
  async getCallById(
    @Param("id", ParseIntPipe) id: number
  ): Promise<ScheduledCall> {
    return await this.callsService.getScheduledCallById(id);
  }

  @Delete(":id/cancel")
  async cancelCall(
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ message: string }> {
    await this.callsService.cancelCall(id);
    return { message: "Call cancelled successfully" };
  }
}
