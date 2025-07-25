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

  // 🔐 Secreto para 2FA (TOTP)
  @Column({ nullable: true })
  twoFactorSecret?: string;

  // ✅ Estado de activación del 2FA
  @Column({ default: false })
  isTwoFactorEnabled: boolean;
  @Column({ type: 'timestamp', nullable: true })
  last2FAVerifiedAt?: Date;

  @Column('simple-array', { nullable: true })
  trustedDevices?: string[]; // Lista de fingerprints o tokens de dispositivos confiables

  @UpdateDateColumn({ name: 'UpdateAt' })
  UpdateAt: Date;

  @CreateDateColumn({ name: 'CreatedAt' })
  CreatedAt: Date;
}
