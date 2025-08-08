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
import { Ticket } from './ticket.entity';

export enum ParticipantRole {
  CREATOR = 'CREATOR',
  ASSIGNEE = 'ASSIGNEE',
  COLLABORATOR = 'COLLABORATOR',
  OBSERVER = 'OBSERVER',
  APPROVER = 'APPROVER',
  REVIEWER = 'REVIEWER',
}

@Entity('ticket_participants')
@Unique(['ticketId', 'userId'])
@Index(['ticketId', 'role'])
export class TicketParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, ticket => ticket.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column()
  ticketId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
  })
  role: ParticipantRole;

  // Permisos específicos
  @Column({ default: true })
  canComment: boolean;

  @Column({ default: false })
  canEdit: boolean;

  @Column({ default: false })
  canClose: boolean;

  @Column({ default: false })
  canAssign: boolean;

  @Column({ default: true })
  receiveNotifications: boolean;

  // Fechas de participación
  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  removedAt: Date;

  // Usuario que agregó este participante
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'addedBy' })
  addedByUser: User;

  @Column({ nullable: true })
  addedBy: number;
}
