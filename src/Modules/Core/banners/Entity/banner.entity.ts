import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'banners' })
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  link?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagePath?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  imageFileName?: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'int', nullable: true })
  order?: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
