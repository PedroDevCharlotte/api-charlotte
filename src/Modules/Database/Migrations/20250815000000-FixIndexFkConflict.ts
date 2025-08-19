import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixIndexFkConflict20250815000000 implements MigrationInterface {
  name = 'FixIndexFkConflict20250815000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const idxName = 'IDX_d30db10e6bc1d7024427fcb8b6';

    // Obtain current database/schema name
    const dbResult: any = await queryRunner.query(`SELECT DATABASE() as db`);
    const db = dbResult && dbResult[0] && (dbResult[0].db || dbResult[0].DATABASE()) || process.env.DB_NAME || '';
    if (!db) {
      console.log('Could not determine database name, aborting migration FixIndexFkConflict');
      return;
    }

    // Find tables that contain the index
    const stats: Array<any> = await queryRunner.query(
      `SELECT TABLE_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND INDEX_NAME = ?
       GROUP BY TABLE_NAME`,
      [db, idxName]
    );

    if (!stats || stats.length === 0) {
      console.log(`Index ${idxName} not found in database ${db}. Nothing to do.`);
      return;
    }

    for (const row of stats) {
      const table = row.TABLE_NAME;
      const indexColumns = String(row.columns).split(',').map(c => c.trim()).filter(Boolean);

      // Get foreign key constraints that reference any of those columns
      const fkRows: Array<any> = await queryRunner.query(
        `SELECT kcu.CONSTRAINT_NAME, kcu.COLUMN_NAME, kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME, rc.UPDATE_RULE, rc.DELETE_RULE
         FROM information_schema.KEY_COLUMN_USAGE kcu
         JOIN information_schema.REFERENTIAL_CONSTRAINTS rc ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
         WHERE kcu.TABLE_SCHEMA = ? AND kcu.TABLE_NAME = ? AND kcu.COLUMN_NAME IN (${indexColumns.map(() => '?').join(',')})
           AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
         ORDER BY kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION`,
        [db, table, ...indexColumns]
      );

      // Group by constraint name to get full column sets
      const fksByName: Record<string, any> = {};
      for (const fk of fkRows) {
        const name = fk.CONSTRAINT_NAME;
        if (!fksByName[name]) {
          fksByName[name] = {
            columns: [],
            referencedTable: fk.REFERENCED_TABLE_NAME,
            referencedColumns: [],
            updateRule: fk.UPDATE_RULE,
            deleteRule: fk.DELETE_RULE,
          };
        }
        fksByName[name].columns.push(fk.COLUMN_NAME);
        fksByName[name].referencedColumns.push(fk.REFERENCED_COLUMN_NAME);
      }

      // Drop foreign keys first
      for (const fkName of Object.keys(fksByName)) {
        try {
          console.log(`Dropping foreign key ${fkName} on table ${table}`);
          await queryRunner.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${fkName}\``);
        } catch (err) {
          console.warn(`Could not drop foreign key ${fkName} on ${table}: ${err && err.message}`);
        }
      }

      // Drop the index
      try {
        console.log(`Dropping index ${idxName} on table ${table}`);
        await queryRunner.query(`DROP INDEX \`${idxName}\` ON \`${table}\``);
      } catch (err) {
        console.warn(`Could not drop index ${idxName} on ${table}: ${err && err.message}`);
      }

      // Recreate the index with the same columns (so FK can be recreated)
      try {
        const colsEscaped = indexColumns.map(c => `\`${c}\``).join(', ');
        console.log(`Recreating index ${idxName} on table ${table}(${colsEscaped})`);
        await queryRunner.query(`CREATE INDEX \`${idxName}\` ON \`${table}\` (${colsEscaped})`);
      } catch (err) {
        console.warn(`Could not recreate index ${idxName} on ${table}: ${err && err.message}`);
      }

      // Recreate foreign keys
      for (const fkName of Object.keys(fksByName)) {
        const fk = fksByName[fkName];
        const cols = fk.columns.map((c: string) => `\`${c}\``).join(', ');
        const refCols = fk.referencedColumns.map((c: string) => `\`${c}\``).join(', ');
        const refTable = fk.referencedTable;
        const onUpdate = fk.updateRule || 'RESTRICT';
        const onDelete = fk.deleteRule || 'RESTRICT';
        const addFkSql = `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${fkName}\` FOREIGN KEY (${cols}) REFERENCES \`${refTable}\` (${refCols}) ON UPDATE ${onUpdate} ON DELETE ${onDelete}`;
        try {
          console.log(`Recreating foreign key ${fkName} on table ${table}`);
          await queryRunner.query(addFkSql);
        } catch (err) {
          console.warn(`Could not recreate foreign key ${fkName} on ${table}: ${err && err.message}`);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // no-op: this migration is corrective and may not be reversible automatically
    console.log('Down migration for FixIndexFkConflict is a no-op');
    return Promise.resolve();
  }
}
