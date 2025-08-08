import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';

// Forward reference para evitar circular dependency
import type { User } from '../../users/Entity/user.entity';

@Entity({ name: 'ticket_types' })
export class TicketType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string; // Soporte, Proyecto, Reporte, Marketing

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 20, nullable: true })
  code: string; // SUPPORT, PROJECT, REPORT, MARKETING

  @Column({ length: 7, nullable: true })
  color: string; // Color hex para mostrar en UI (#FF5722, #2196F3, etc.)

  @Column({ type: 'int', default: 0 })
  priority: number; // Prioridad para ordenamiento (0-999)

  // 👤 Usuario asignado por defecto para este tipo de soporte
  @Column({ nullable: true })
  defaultUserId?: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  // 🔗 Relaciones
  // Usuario asignado por defecto
  @ManyToOne('User', 'defaultForTicketTypes', { nullable: true })
  @JoinColumn({ name: 'defaultUserId' })
  defaultUser?: User;

  // Usuarios que pueden dar soporte a este tipo
  @ManyToMany('User', 'supportTypes')
  supportUsers: User[];
}
