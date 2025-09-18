import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/Entity/user.entity';

@Entity('non_conformity_follow_ups')
export class FollowUp {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => require('./non-conformity.entity').NonConformity, (nc: any) => nc.followUps)
  @JoinColumn({ name: 'nonConformityId' })
  nonConformity: any;

  @Column()
  nonConformityId: number;

  @Column({ type: 'datetime' })
  date: Date; // FECHA

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifiedByUser: User; // VERIFICADO POR

  @Column({ nullable: true })
  verifiedBy: number;

  @Column('text', { nullable: true })
  justification: string; // JUSTIFICACION

  @Column({ default: false })
  isEffective: boolean; // ES EFECTIVO

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
