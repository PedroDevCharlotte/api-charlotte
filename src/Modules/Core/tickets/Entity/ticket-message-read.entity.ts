import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/Entity/user.entity';
import { TicketMessage } from './ticket-message.entity';

@Entity('ticket_message_reads')
@Unique(['messageId', 'userId'])
@Index(['messageId'])
@Index(['userId'])
export class TicketMessageRead {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TicketMessage, message => message.reads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: TicketMessage;

  @Column()
  messageId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  readAt: Date;
}
