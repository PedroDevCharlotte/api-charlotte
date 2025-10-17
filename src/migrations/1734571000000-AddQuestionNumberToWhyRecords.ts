import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddQuestionNumberToWhyRecords1734571000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('non_conformity_whys', new TableColumn({
      name: 'questionNumber',
      type: 'int',
      isNullable: true,
      comment: 'Número de la pregunta (1-5) en el análisis de 5 porqués'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('non_conformity_whys', 'questionNumber');
  }
}