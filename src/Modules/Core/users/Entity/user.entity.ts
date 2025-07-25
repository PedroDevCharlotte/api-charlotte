import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

@Entity({name: 'users'})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  role: string;

  
  @UpdateDateColumn({ name: 'UpdateAt' })
  UpdateAt: Date;

  @CreateDateColumn({ name: 'CreatedAt' })
  CreatedAt: Date;
}
