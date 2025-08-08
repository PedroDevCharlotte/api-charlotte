import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EntityDefinition } from './entity.entity';
import { GeneralList } from './general-list.entity';
import { EntityFieldValue } from './entity-field-value.entity';

export enum FieldType {
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  AUTOCOMPLETE = 'AUTOCOMPLETE',
}

@Entity('field_definitions')
@Index(['entityId', 'fieldName'], { unique: true })
@Index(['entityId', 'sortOrder'])
export class FieldDefinition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entityId: number;

  @Column({ length: 100 })
  fieldName: string; // Nombre del campo en la entidad

  @Column({ length: 200 })
  displayName: string; // Nombre a mostrar

  @Column({
    type: 'enum',
    enum: FieldType,
    default: FieldType.SELECT,
  })
  fieldType: FieldType;

  @Column()
  listId: number;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column('json', { nullable: true })
  validationRules: any; // Reglas de validación JSON

  @Column({ length: 500, nullable: true })
  helpText: string;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => EntityDefinition, entity => entity.fieldDefinitions)
  @JoinColumn({ name: 'entityId' })
  entity: EntityDefinition;

  @ManyToOne(() => GeneralList, list => list.fieldDefinitions)
  @JoinColumn({ name: 'listId' })
  sourceList: GeneralList;

  @OneToMany(() => EntityFieldValue, fieldValue => fieldValue.fieldDefinition)
  fieldValues: EntityFieldValue[];
}
