import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'ticket_feedbacks' })
export class TicketFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64 })
  ticketId: string;

  @Column({ type: 'int' })
  knowledge: number;

  @Column({ type: 'int' })
  timing: number;

  @Column({ type: 'int' })
  escalation: number;

  @Column({ type: 'int' })
  resolved: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
