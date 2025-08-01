import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/Entity/user.entity';

@Entity({ name: 'departments' })
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string; // IT, HR, Finance, Sales, etc.

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 10, nullable: true })
  code: string; // Código corto del departamento (IT, HR, etc.)

  @Column({ nullable: true, type: 'int' })
  managerId?: number | null; // ID del manager del departamento

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  // Relación uno a muchos con usuarios
  @OneToMany(() => User, (user) => user.department)
  users: User[];
}
