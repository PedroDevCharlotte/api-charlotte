import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Role } from '../../roles/Entity/role.entity';
import { Department } from '../../departments/Entity/department.entity';
import { TicketType } from '../../ticket-types/Entity/ticket-type.entity';

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

  // 👤 Jerarquía - Jefe directo (nullable para usuarios de alto nivel)
  @Column({ nullable: true })
  managerId?: number;

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

  // Emoji generado a partir de foto (p. ej. un pequeño texto o unicode)
  @Column({ nullable: true })
  emoji?: string;

  // Avatar personalizado: JSON con configuración y/o dataURL de la imagen generada por el cliente
  // Almacena un objeto serializado (TEXT) con la forma { baseImage?: string, config?: {...} }
  @Column({ type: 'text', nullable: true })
  avatar?: string;

  // 🔗 Relaciones
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Department, (department) => department.users)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  // 👤 Jerarquía - Relación con el jefe directo
  @ManyToOne(() => User, (user) => user.subordinates, { nullable: true })
  @JoinColumn({ name: 'managerId' })
  manager?: User;

  // 👥 Empleados que reportan a este usuario
  @OneToMany(() => User, (user) => user.manager)
  subordinates: User[];

  // 🎫 Tipos de soporte que puede manejar este usuario
  @ManyToMany(() => TicketType, (ticketType) => ticketType.supportUsers)
  @JoinTable({
    name: 'user_support_types',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'ticketTypeId', referencedColumnName: 'id' }
  })
  supportTypes: TicketType[];

  // 🎫 Tipos de soporte donde este usuario es el asignado por defecto
  @OneToMany(() => TicketType, (ticketType) => ticketType.defaultUser)
  defaultForTicketTypes: TicketType[];
}
