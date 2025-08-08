import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/Entity/user.entity';
import { Ticket } from './ticket.entity';
import { TicketMessageRead } from './ticket-message-read.entity';

export enum MessageType {
  COMMENT = 'COMMENT',
  SYSTEM = 'SYSTEM',
  ATTACHMENT = 'ATTACHMENT',
  STATUS_CHANGE = 'STATUS_CHANGE',
  ASSIGNMENT = 'ASSIGNMENT',
  ESCALATION = 'ESCALATION',
}

@Entity('ticket_messages')
@Index(['ticketId', 'createdAt'])
@Index(['senderId'])
@Index(['type'])
export class TicketMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, ticket => ticket.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column()
  ticketId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: number;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.COMMENT,
  })
  type: MessageType;

  // Para mensajes del sistema con metadatos adicionales
  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isInternal: boolean; // Solo visible para personal interno

  @Column({ default: false })
  isEdited: boolean;

  // Para respuestas anidadas
  @ManyToOne(() => TicketMessage, { nullable: true })
  @JoinColumn({ name: 'replyToId' })
  replyTo: TicketMessage;

  @Column({ nullable: true })
  replyToId: number;

  @OneToMany(() => TicketMessage, message => message.replyTo)
  replies: TicketMessage[];

  // Control de lectura
  @OneToMany(() => TicketMessageRead, read => read.message, { cascade: true })
  reads: TicketMessageRead[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;

  // Usuario que editó el mensaje (si aplica)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'editedBy' })
  editedByUser: User;

  @Column({ nullable: true })
  editedBy: number;

  @Column({ type: 'datetime', nullable: true })
  editedAt: Date;
}
