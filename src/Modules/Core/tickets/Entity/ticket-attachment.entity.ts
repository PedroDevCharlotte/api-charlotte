import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/Entity/user.entity';
import { Ticket } from './ticket.entity';
import { TicketMessage } from './ticket-message.entity';

@Entity('ticket_attachments')
@Index(['ticketId'])
@Index(['messageId'])
@Index(['uploadedById'])
export class TicketAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, ticket => ticket.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column()
  ticketId: number;

  // Opcional: archivo adjunto a un mensaje específico
  @ManyToOne(() => TicketMessage, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: TicketMessage;

  @Column({ nullable: true })
  messageId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column()
  uploadedById: number;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 255 })
  originalFileName: string;


  @Column({ type: 'text' })
  filePath: string;

  /**
   * Id del archivo en OneDrive (file.id), para obtener la vista previa o descargar el archivo correctamente.
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  oneDriveFileId?: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number; // en bytes

  @Column({ length: 32, nullable: true })
  fileHash: string; // MD5 hash para detectar duplicados

  @Column({ default: false })
  isPublic: boolean; // Si el archivo es visible para usuarios externos

  @Column('text', { nullable: true })
  description: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date;
}
