import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/Entity/user.entity';
import { NonConformity } from './non-conformity.entity';

@Entity('non_conformity_follow_ups')
export class FollowUp {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NonConformity, (nonConformity) => nonConformity.followUps)
  @JoinColumn({ name: 'nonConformityId' })
  nonConformity: NonConformity;

  @Column()
  nonConformityId: number;

  @Column({ type: 'datetime' })
  date: Date; // FECHA

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifiedByUser: User; // VERIFICADO POR

  @Column({ nullable: true })
  verifiedBy: number;

  @Column('varchar', { nullable: true, length: 255 })
  verifiedByOther: string; // OTRO AUDITOR (cuando se selecciona "Otro")

  @Column('text', { nullable: true })
  justification: string; // JUSTIFICACION

  @Column({ default: false })
  isEffective: boolean; // ES EFECTIVO

  // // Relación many-to-many directa con usuarios responsables
  // @ManyToMany(() => User, { cascade: true, eager: true })
  // @JoinTable({
  //   name: 'follow_up_responsibles',
  //   joinColumn: { name: 'followUpId', referencedColumnName: 'id' },
  //   inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  // })
  // responsibles: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
