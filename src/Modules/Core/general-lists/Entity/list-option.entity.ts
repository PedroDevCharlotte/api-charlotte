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
import { GeneralList } from './general-list.entity';
import { ListOptionTranslation } from './list-option-translation.entity';

@Entity('list_options')
@Index(['listId', 'code'], { unique: true })
@Index(['listId', 'sortOrder'])
export class ListOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  listId: number;

  @Column({ length: 50 })
  code: string; // Código único dentro de la lista

  @Column({ length: 100 })
  value: string; // Valor interno

  @Column({ length: 200 })
  displayText: string; // Texto a mostrar

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 7, nullable: true })
  color: string; // Color hex (#FF5722)

  @Column({ length: 50, nullable: true })
  icon: string; // Nombre del icono

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  parentOptionId: number;

  @Column('json', { nullable: true })
  metadata: any; // Datos adicionales en JSON

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => GeneralList, list => list.options)
  @JoinColumn({ name: 'listId' })
  list: GeneralList;

  @ManyToOne(() => ListOption, option => option.childOptions, { nullable: true })
  @JoinColumn({ name: 'parentOptionId' })
  parentOption: ListOption;

  @OneToMany(() => ListOption, option => option.parentOption)
  childOptions: ListOption[];

  @OneToMany(() => ListOptionTranslation, translation => translation.listOption)
  translations: ListOptionTranslation[];
}
