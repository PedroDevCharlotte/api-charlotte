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
import { TicketType } from '../../ticket-types/Entity/ticket-type.entity';
import { Department } from '../../departments/Entity/department.entity';
import { TicketMessage } from './ticket-message.entity';
import { TicketParticipant } from './ticket-participant.entity';
import { TicketAttachment } from './ticket-attachment.entity';
import { TicketHistory } from './ticket-history.entity';

export enum TicketStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_RESPONSE = 'WAITING_RESPONSE',
  ON_HOLD = 'ON_HOLD',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

@Entity('tickets')
@Index(['status', 'priority'])
@Index(['createdBy', 'status'])
@Index(['assignedTo', 'status'])
@Index(['departmentId', 'status'])
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  ticketNumber: string; // Ej: TKT-2025-001

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  // Relación con tipo de ticket
  @ManyToOne(() => TicketType, { eager: true })
  @JoinColumn({ name: 'ticketTypeId' })
  ticketType: TicketType;

  @Column()
  ticketTypeId: number;

  // Usuario que creó el ticket
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column()
  createdBy: number;

  // Usuario asignado principal
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedTo' })
  assignee: User;

  @Column({ nullable: true })
  assignedTo: number;

  // Departamento responsable
  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ nullable: true })
  departmentId: number;

  // Fechas importantes
  @Column({ type: 'datetime', nullable: true })
  dueDate: Date;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  closedAt: Date;

  // Métricas de tiempo
  @Column({ type: 'int', nullable: true })
  estimatedHours: number;

  @Column({ type: 'int', nullable: true })
  actualHours: number;

  // Tags para búsqueda
  @Column('json', { nullable: true })
  tags: string[];

  // Configuración
  @Column({ default: true })
  notificationsEnabled: boolean;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ default: false })
  isInternal: boolean;

  // Metadatos adicionales
  @Column('json', { nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => TicketMessage, (message: TicketMessage) => message.ticket, { cascade: true })
  messages: TicketMessage[];

  @OneToMany(() => TicketParticipant, (participant: TicketParticipant) => participant.ticket, { cascade: true })
  participants: TicketParticipant[];

  @OneToMany(() => TicketAttachment, (attachment: TicketAttachment) => attachment.ticket, { cascade: true })
  attachments: TicketAttachment[];

  @OneToMany(() => TicketHistory, (history: TicketHistory) => history.ticket, { cascade: true })
  history: TicketHistory[];

  // Tickets relacionados (padre/hijo)
  @ManyToOne(() => Ticket, { nullable: true })
  @JoinColumn({ name: 'parentTicketId' })
  parentTicket: Ticket;

  @Column({ nullable: true })
  parentTicketId: number;

  @OneToMany(() => Ticket, (ticket: Ticket) => ticket.parentTicket)
  childTickets: Ticket[];
}
