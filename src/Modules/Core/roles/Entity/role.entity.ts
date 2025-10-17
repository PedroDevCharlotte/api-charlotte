import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/Entity/user.entity';
import { Permission } from '../../permissions/Entity/permission.entity';

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

  // Relación many-to-many con la entidad Permission
  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable({ name: 'roles_permissions' })
  permissions: Permission[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  // Relación uno a muchos con usuarios
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
