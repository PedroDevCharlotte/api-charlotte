import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EntityDefinition } from './entity.entity';
import { FieldDefinition } from './field-definition.entity';

@Entity('entity_field_values')
@Index(['entityId', 'entityRecordId', 'fieldDefinitionId'], { unique: true })
@Index(['entityId', 'entityRecordId'])
export class EntityFieldValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entityId: number;

  @Column()
  fieldDefinitionId: number;

  @Column({ length: 50 })
  entityRecordId: string; // ID del registro específico

  @Column({ type: 'text', nullable: true })
  value: string; // Valor simple

  @Column('json', { nullable: true })
  multipleValues: any; // Para campos múltiples

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => EntityDefinition, entity => entity.fieldValues)
  @JoinColumn({ name: 'entityId' })
  entity: EntityDefinition;

  @ManyToOne(() => FieldDefinition, fieldDef => fieldDef.fieldValues)
  @JoinColumn({ name: 'fieldDefinitionId' })
  fieldDefinition: FieldDefinition;
}
