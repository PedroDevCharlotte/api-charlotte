import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/Entity/user.entity';

@Entity('session_log')
@Index(['userId'])
@Index(['loginAt'])
@Index(['logoutAt'])
@Index(['isActive'])
export class SessionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userEmail: string; // Email del usuario para referencia

  // sessionToken puede ser grande (JWT) — se usa TEXT para evitar límites de fila.
  // No se indexa/unique por su longitud; si necesitas búsqueda/validación, guarda un hash corto indexado.
  @Column({ type: 'text' })
  sessionToken: string; // JWT token o session ID

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceInfo: string; // Información del dispositivo

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string; // Ubicación geográfica aproximada

  @Column({ type: 'varchar', length: 50, default: 'PASSWORD' })
  loginMethod: string; // PASSWORD, 2FA, SSO, etc.

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Si la sesión está activa

  @Column({ type: 'varchar', length: 50, nullable: true })
  logoutReason: string; // MANUAL, TIMEOUT, FORCE, EXPIRED

  @CreateDateColumn()
  loginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  logoutAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActivity: Date; // Última actividad en la sesión

  @UpdateDateColumn()
  updatedAt: Date;

  // Relación con usuario - Comentada temporalmente para evitar problemas de FK
  // @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'userId' })
  // user: User;

  // Duración de la sesión en segundos (calculado)
  get sessionDuration(): number | null {
    if (!this.logoutAt) return null;
    return Math.floor((this.logoutAt.getTime() - this.loginAt.getTime()) / 1000);
  }
}
