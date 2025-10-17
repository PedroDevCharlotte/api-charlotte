import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NonConformity } from './non-conformity.entity';

export enum WhyType {
  WHY_HAD_PROBLEM = 'WHY_HAD_PROBLEM',
  WHY_NOT_DETECTED = 'WHY_NOT_DETECTED',
}

@Entity('non_conformity_whys')
export class WhyRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NonConformity, (nonConformity) => nonConformity.whyRecords)
  @JoinColumn({ name: 'nonConformityId' })
  nonConformity: NonConformity;

  @Column()
  nonConformityId: number;

  @Column('text')
  description: string;

  @Column({ type: 'int', nullable: true })
  questionNumber: number;

  @Column({ type: 'enum', enum: WhyType, nullable: true })
  type: WhyType; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
