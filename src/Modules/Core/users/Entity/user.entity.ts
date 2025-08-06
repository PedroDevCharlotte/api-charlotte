import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../roles/Entity/role.entity';
import { Department } from '../../departments/Entity/department.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;
  
  @Column({ nullable: true })
  passwordResetCode?: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetCodeExpiresAt?: Date;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // 🏢 Relación con rol - Foreign Key
  @Column()
  roleId: number;

  // 🏬 Relación con departamento - Foreign Key
  @Column()
  departmentId: number;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  isBlocked: boolean;

  // 🔐 Secreto para 2FA (TOTP)
  @Column({ nullable: true })
  twoFactorSecret?: string;

  // 📱 Secreto temporal para habilitar 2FA
  @Column({ nullable: true })
  temp2FASecret?: string;

  // ✅ Estado de activación del 2FA
  @Column({ default: false })
  isTwoFactorEnabled: boolean;
  @Column({ type: 'timestamp', nullable: true })
  last2FAVerifiedAt?: Date;
  @Column({ nullable: true })
  daysToPasswordExpiration?: number; // Días para expiración de contraseña
  @Column('simple-array', { nullable: true })
  trustedDevices?: string[]; 
  @Column({ type: 'datetime', nullable: true })
  dateToPasswordExpiration?: Date; // Fecha de expiración de contraseña

  @Column({ default: true })
  isFirstLogin: boolean;

  @UpdateDateColumn({ name: 'UpdateAt' })
  UpdateAt: Date;
  

  @CreateDateColumn({ name: 'CreatedAt' })
  CreatedAt: Date;

  // 🔗 Relaciones
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Department, (department) => department.users)
  @JoinColumn({ name: 'departmentId' })
  department: Department;
}
