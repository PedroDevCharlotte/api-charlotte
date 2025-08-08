import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ListOption } from './list-option.entity';

@Entity('list_option_translations')
@Index(['listOptionId', 'language'], { unique: true })
export class ListOptionTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  listOptionId: number;

  @Column({ length: 5 })
  language: string; // ISO code (es, en, fr, etc.)

  @Column({ length: 200 })
  displayText: string;

  @Column({ length: 255, nullable: true })
  description: string;

  // Relaciones
  @ManyToOne(() => ListOption, option => option.translations)
  @JoinColumn({ name: 'listOptionId' })
  listOption: ListOption;
}
