import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FieldDefinition } from './field-definition.entity';
import { EntityFieldValue } from './entity-field-value.entity';

@Entity('entities')
@Index(['tableName'], { unique: true })
export class EntityDefinition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string; // Nombre amigable (ej: "Tickets", "Usuarios", "Proyectos")

  @Column({ length: 100 })
  tableName: string; // Nombre de tabla (ej: "tickets", "users", "projects")

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => FieldDefinition, fieldDefinition => fieldDefinition.entity)
  fieldDefinitions: FieldDefinition[];

  @OneToMany(() => EntityFieldValue, fieldValue => fieldValue.entity)
  fieldValues: EntityFieldValue[];
}
