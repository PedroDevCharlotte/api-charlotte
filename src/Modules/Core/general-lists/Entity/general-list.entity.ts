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
import { ListOption } from './list-option.entity';
import { FieldDefinition } from './field-definition.entity';

export enum ListCategory {
  STATUS = 'STATUS',
  PRIORITY = 'PRIORITY',
  DEPARTMENT = 'DEPARTMENT',
  COUNTRY = 'COUNTRY',
  CURRENCY = 'CURRENCY',
  TICKET_TYPE = 'TICKET_TYPE',
  PROJECT_TYPE = 'PROJECT_TYPE',
  CUSTOM = 'CUSTOM',
}

@Entity('general_lists')
@Index(['code'], { unique: true })
@Index(['category'])
export class GeneralList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  code: string; // Código único (ej: "TICKET_STATUS", "PRIORITIES", "COUNTRIES")

  @Column({ length: 100 })
  name: string; // Nombre amigable

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ListCategory,
    default: ListCategory.CUSTOM,
  })
  category: ListCategory;

  @Column({ default: false })
  isSystemList: boolean; // No se puede eliminar si es true

  @Column({ default: false })
  allowCustomValues: boolean; // Permite agregar valores personalizados

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  parentListId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => GeneralList, list => list.childLists, { nullable: true })
  @JoinColumn({ name: 'parentListId' })
  parentList: GeneralList;

  @OneToMany(() => GeneralList, list => list.parentList)
  childLists: GeneralList[];

  @OneToMany(() => ListOption, option => option.list)
  options: ListOption[];

  @OneToMany(() => FieldDefinition, fieldDefinition => fieldDefinition.sourceList)
  fieldDefinitions: FieldDefinition[];
}
