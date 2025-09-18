import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/Entity/user.entity';
import { ListOption } from '../../general-lists/Entity/list-option.entity';
// related entities are referenced dynamically below to avoid circular imports

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

  @Column({ type: 'enum', enum: Classification, nullable: true })
  classification: Classification; // CLASIFICACION DE LA NO CONFORMIDAD

  @Column({ type: 'enum', enum: Category, nullable: true })
  category: Category; // CATEGORIA DE LA NO CONFORMIDAD

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

  @Column({ default: false })
  hasSimilarCases: boolean; // EXISTEN CASOS SIMILARES

  @Column('text', { nullable: true })
  similarCasesDetails: string; // DETALLE DE CASOS SIMILARES

  @Column('text', { nullable: true })
  rootCauseDetermination: string; // DETERMINACION DE LA CAUSA RAIZ

  @OneToMany(() => require('./action-plan.entity').ActionPlan, (plan: any) => plan.nonConformity, { cascade: true })
  actionPlans: any[];

  @OneToMany(() => require('./follow-up.entity').FollowUp, (f: any) => f.nonConformity, { cascade: true })
  followUps: any[];

  @OneToMany(() => require('./why-record.entity').WhyRecord, (w: any) => w.nonConformity, { cascade: true })
  whyRecords: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
