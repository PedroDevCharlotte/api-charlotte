import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRowSizeAndPermissions20250901000000 implements MigrationInterface {
  name = 'FixRowSizeAndPermissions20250901000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Determine current database name
    const dbResult: any = await queryRunner.query(`SELECT DATABASE() as db`);
    const db = dbResult && dbResult[0] && (dbResult[0].db || dbResult[0].DATABASE()) || process.env.DB_NAME || '';
    if (!db) {
      console.log('Could not determine database name, aborting migration FixRowSizeAndPermissions');
      return;
    }

    // Prepare list of ALTER statements to convert wide columns to LONGTEXT and set ROW_FORMAT to DYNAMIC
    const alters: string[] = [
      // Make tables use DYNAMIC row format to allow off-page storage for LONGTEXT/TEXT
      `ALTER TABLE \`roles\` ROW_FORMAT=DYNAMIC`,
      `ALTER TABLE \`banners\` ROW_FORMAT=DYNAMIC`,
      `ALTER TABLE \`session_log\` ROW_FORMAT=DYNAMIC`,
      `ALTER TABLE \`field_definitions\` ROW_FORMAT=DYNAMIC`,
      `ALTER TABLE \`entity_field_values\` ROW_FORMAT=DYNAMIC`,
      `ALTER TABLE \`ticket_attachments\` ROW_FORMAT=DYNAMIC`,

      // Convert specific columns that were long VARCHAR/JSON to LONGTEXT so they do not count against row-size limit
      `ALTER TABLE \`roles\` MODIFY \`permissions\` LONGTEXT NULL`,
      `ALTER TABLE \`banners\` MODIFY \`description\` LONGTEXT NULL`,
      `ALTER TABLE \`banners\` MODIFY \`link\` LONGTEXT NULL`,
      `ALTER TABLE \`banners\` MODIFY \`imagePath\` LONGTEXT NULL`,
      `ALTER TABLE \`session_log\` MODIFY \`sessionToken\` LONGTEXT NOT NULL`,
      `ALTER TABLE \`session_log\` MODIFY \`userAgent\` LONGTEXT NULL`,
      `ALTER TABLE \`field_definitions\` MODIFY \`helpText\` LONGTEXT NULL`,
      `ALTER TABLE \`entity_field_values\` MODIFY \`value\` LONGTEXT NULL`,
      `ALTER TABLE \`ticket_attachments\` MODIFY \`filePath\` LONGTEXT NOT NULL`,
    ];

    for (const sql of alters) {
      try {
        console.log('Running:', sql);
        await queryRunner.query(sql);
      } catch (err) {
        console.warn('Migration statement failed:', sql, err && err.message);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverting to previous types is destructive/unreliable; we keep this as a no-op with logging.
    console.log('Down migration for FixRowSizeAndPermissions is a no-op. Manual revert may be required.');
    return Promise.resolve();
  }
}
