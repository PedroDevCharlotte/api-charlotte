import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum WhyType {
  WHY_HAD_PROBLEM = 'WHY_HAD_PROBLEM',
  WHY_NOT_DETECTED = 'WHY_NOT_DETECTED',
}

@Entity('non_conformity_whys')
export class WhyRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => require('./non-conformity.entity').NonConformity, (nc: any) => nc.whyRecords)
  @JoinColumn({ name: 'nonConformityId' })
  nonConformity: any;

  @Column()
  nonConformityId: number;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: WhyType, nullable: true })
  type: WhyType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
