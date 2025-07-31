import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  isActive: boolean;

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

  @Column('simple-array', { nullable: true })
  trustedDevices?: string[]; 

  @UpdateDateColumn({ name: 'UpdateAt' })
  UpdateAt: Date;

  @CreateDateColumn({ name: 'CreatedAt' })
  CreatedAt: Date;
}
