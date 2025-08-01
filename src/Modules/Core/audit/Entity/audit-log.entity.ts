import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/Entity/user.entity';

@Entity('audit_log')
@Index(['entityType', 'entityId'])
@Index(['userId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  entityType: string; // Tipo de entidad (User, Product, Order, etc.)

  @Column({ type: 'int' })
  entityId: number; // ID de la entidad modificada

  @Column({ type: 'varchar', length: 50 })
  action: string; // CREATE, UPDATE, DELETE

  @Column({ type: 'int', nullable: true })
  userId: number | null; // Usuario que realizó la acción

  @Column({ type: 'varchar', length: 100, nullable: true })
  userEmail: string | null; // Email del usuario (por si se elimina el usuario)

  @Column({ type: 'text', nullable: true })
  oldValues: string | null; // Valores anteriores (JSON)

  @Column({ type: 'text', nullable: true })
  newValues: string | null; // Nuevos valores (JSON)

  @Column({ type: 'text', nullable: true })
  changedFields: string; // Campos que cambiaron (JSON array)

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null; // IP del usuario

  @Column({ type: 'text', nullable: true })
  userAgent: string | null; // User agent del navegador

  @Column({ type: 'text', nullable: true })
  description: string | null; // Descripción adicional del cambio

  @CreateDateColumn()
  createdAt: Date;

  // Relación con usuario (puede ser null si el usuario fue eliminado) - Comentada temporalmente
  // @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'userId' })
  // user: User;
}
