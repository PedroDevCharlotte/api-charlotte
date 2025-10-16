import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NonConformity } from './non-conformity.entity';
import { User } from '../../users/Entity/user.entity';

export enum ActionType {
  PRINCIPAL = 'principal',
  SECUNDARIA = 'secundaria',
  CONTAINMENT = 'CONTAINMENT',
  CORRECTIVE = 'CORRECTIVE',
  PREVENTIVE = 'PREVENTIVE',
}

@Entity('action_plans')
export class ActionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NonConformity, (nonConformity) => nonConformity.actionPlans)
  @JoinColumn({ name: 'nonConformityId' })
  nonConformity: NonConformity;

  @Column()
  nonConformityId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string; // TIPO DE ACCION

  @Column('text')
  description: string; // DESCRIPCION DE LA ACCION
 
  @Column({ type: 'datetime', nullable: true })
  commitmentDate: Date | null; // FECHA DE COMPROMISO

  // Relación many-to-many directa con usuarios responsables
  @ManyToMany(() => User, { cascade: true, eager: true })
  @JoinTable({
    name: 'action_plan_responsibles',
    joinColumn: { name: 'actionPlanId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  })
  responsibles: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}