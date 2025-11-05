import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scheduled_calls')
export class ScheduledCall {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phoneNumber: string;

  @Column()
  scheduledTime: Date;

  @Column({ default: 'pending' })
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

  @Column({ nullable: true })
  callId: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
