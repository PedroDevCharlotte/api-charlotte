import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/Entity/user.entity';
import { ListOption } from '../../general-lists/Entity/list-option.entity';
import { ActionPlan } from './action-plan.entity';
import { FollowUp } from './follow-up.entity';
import { WhyRecord } from './why-record.entity';

export enum Classification {
  NC = 'NC',
  OBSERVATION = 'OBSERVATION',
}

export enum Category {
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  NA = 'NA',
}

@Entity('non_conformities')
@Index(['number'], { unique: true })
export class NonConformity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50})
  number: string; // NUMERO DE NO CONFORMIDAD

  @Column({ type: 'datetime', nullable: true })
  validFrom: Date; // VIGENTE A PARTIR DE

  @Column({ type: 'datetime', nullable: true })
  validTo: Date; // VALIDO HASTA

  // Type -> stored as reference to a general-list option
  @ManyToOne(() => ListOption, { nullable: true, eager: true })
  @JoinColumn({ name: 'typeOptionId' })
  typeOption: ListOption;

  @Column({ nullable: true })
  typeOptionId: number;

  @Column({ length: 100, nullable: true })
  otherType: string; // OTRO TIPO DE NO CONFORMIDAD

  @Column({ type: 'datetime', nullable: true })
  createdAtDate: Date; // FECHA DE ELABORACION

  @Column({ type: 'datetime', nullable: true })
  detectedAt: Date; // FECHA DE DETECCION

  @Column({ type: 'datetime', nullable: true })
  closedAt: Date; // FECHA DE CIERRE

  @Column({ length: 200, nullable: true })
  areaOrProcess: string; // AREA Y/O PROCESO

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'areaResponsibleId' })
  areaResponsible: User; // RESPONSABLE DE AREA

  @Column({ nullable: true })
  areaResponsibleId: number;

  @ManyToOne(() => ListOption, { nullable: true, eager: true })
  @JoinColumn({ name: 'classificationOptionId' })
  classificationOption: ListOption;

  @Column({ nullable: true })
  classificationOptionId: number;

  @ManyToOne(() => ListOption, { nullable: true, eager: true })
  @JoinColumn({ name: 'categoryOptionId' })
  categoryOption: ListOption;

  @Column({ nullable: true })
  categoryOptionId: number;

  // Motive -> reference to list option
  @ManyToOne(() => ListOption, { nullable: true, eager: true })
  @JoinColumn({ name: 'motiveOptionId' })
  motiveOption: ListOption;

  @Column({ nullable: true })
  motiveOptionId: number;

  @Column({ length: 255, nullable: true })
  otherMotive: string; // OTRO

  @Column('text', { nullable: true })
  findingDescription: string; // DESCRIPCION DEL HALLAZGO

  @Column('text', { nullable: true })
  cause: string; // CAUSA

  @Column({ length: 200, nullable: true })
  investigationReference: string; // REFERENCIA DE INVESTIGACION

  @Column('text', { nullable: true })
  observations: string; // OBSERVACIONES

  @Column({ length: 200, nullable: true })
  reference: string; // REFERENCIA

  @Column('json', { nullable: true })
  participants: string[]; // PERSONAL PARTICIPANTE

  
  @Column({ length: 200, nullable: true })
  otherResponsible: string; // OTRO RESPONSABLE ESPECIFICADO

  @Column({ length: 200, nullable: true })
  otherParticipant: string; // OTRO PARTICIPANTE ESPECIFICADO

  @Column('json', { nullable: true })
  fiveWhysParticipants: any[]; // PARTICIPANTES EN ANALISIS DE 5 PORQUES

  @Column({ type: 'date', nullable: true })
  fiveWhysDate: Date; // FECHA DEL ANALISIS DE 5 PORQUES

  @Column({ default: false })
  hasSimilarCases: boolean; // EXISTEN CASOS SIMILARES

  @Column('text', { nullable: true })
  similarCasesDetails: string; // DETALLE DE CASOS SIMILARES

  @Column('text', { nullable: true })
  rootCauseDetermination: string; // DETERMINACION DE LA CAUSA RAIZ

  @OneToMany(() => ActionPlan, (plan) => plan.nonConformity, { cascade: true })
  actionPlans: ActionPlan[];

  @OneToMany(() => FollowUp, (followUp) => followUp.nonConformity, { cascade: true })
  followUps: FollowUp[];

  @OneToMany(() => WhyRecord, (whyRecord) => whyRecord.nonConformity, { cascade: true })
  whyRecords: WhyRecord[];

  // Campos para manejo de estado y cancelación
  @Column({ length: 50, default: 'open' })
  status: string; // Estado: 'open', 'in_progress', 'closed', 'cancelled'

  @Column('text', { nullable: true })
  cancellationReason: string; // Razón de cancelación

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date; // Fecha de cancelación

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
