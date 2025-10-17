import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVerifiedByOtherToFollowUps1734570000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('non_conformity_follow_ups', new TableColumn({
      name: 'verifiedByOther',
      type: 'varchar',
      length: '255',
      isNullable: true,
      comment: 'Nombre del auditor cuando se selecciona "Otro" en verifiedBy'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('non_conformity_follow_ups', 'verifiedByOther');
  }
}