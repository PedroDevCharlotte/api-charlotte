import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Role } from '../../roles/Entity/role.entity';

@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 150 })
  name: string; // e.g. 'users.create', 'tickets.read'

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  modulePath?: string; // path of the frontend module this permission belongs to, e.g. '/apps/ticket'

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @ManyToMany(() => Role, (role) => (role.permissions as any))
  roles: Role[];
}
