import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/Entity/user.entity';

@Entity({ name: 'favorites' })
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  title: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'CreatedAt' })
  CreatedAt: Date;

  @UpdateDateColumn({ name: 'UpdateAt' })
  UpdateAt: Date;
}
