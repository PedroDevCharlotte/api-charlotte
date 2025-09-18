import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ListOption } from '../../general-lists/Entity/list-option.entity';

export enum ActionType {
  CONTAINMENT = 'CONTAINMENT',
  CORRECTIVE = 'CORRECTIVE',
  PREVENTIVE = 'PREVENTIVE',
}

@Entity('action_plans')
export class ActionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => require('./non-conformity.entity').NonConformity, (nc: any) => nc.actionPlans)
  @JoinColumn({ name: 'nonConformityId' })
  nonConformity: any;

  @Column()
  nonConformityId: number;

  @Column({ type: 'enum', enum: ActionType, nullable: true })
  type: ActionType; // TIPO DE ACCION

  @Column('text')
  description: string; // DESCRIPCION DE LA ACCION

  @Column({ type: 'datetime', nullable: true })
  commitmentDate: Date; // FECHA DE COMPROMISO

  @ManyToOne(() => ListOption, { nullable: true, eager: true })
  @JoinColumn({ name: 'responsibleOptionId' })
  responsibleOption: ListOption; // RESPUESTABLE (usuario o rol almacenado como option)

  @Column({ nullable: true })
  responsibleOptionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
