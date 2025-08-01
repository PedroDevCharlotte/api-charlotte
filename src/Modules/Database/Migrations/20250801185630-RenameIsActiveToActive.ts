import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameIsActiveToActive20250801185630 implements MigrationInterface {
  name = 'RenameIsActiveToActive20250801185630';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Renombrar la columna isActive a active en la tabla users
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      CHANGE \`isActive\` \`active\` tinyint(1) NOT NULL DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir el cambio
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      CHANGE \`active\` \`isActive\` tinyint(1) NOT NULL DEFAULT 1
    `);
  }
}
