import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/Entity/user.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  name: string; // admin, user, manager, etc.

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  // Almacenar permissions como simple-json (TEXT) para evitar límites de tamaño de fila en MySQL
  // TypeORM serializa/deserializa automáticamente el array.
  @Column('simple-json', { nullable: true })
  permissions: string[]; // Array de permisos

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  // Relación uno a muchos con usuarios
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
