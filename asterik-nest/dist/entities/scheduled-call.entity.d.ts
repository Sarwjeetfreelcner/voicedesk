export declare class ScheduledCall {
    id: number;
    phoneNumber: string;
    scheduledTime: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    callId: string;
    errorMessage: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}
