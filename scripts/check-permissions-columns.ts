import 'ts-node/register';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  try {
    console.log('Loading ormconfig.json...');
    const cfgPath = path.join(__dirname, '..', 'ormconfig.json');
    if (!fs.existsSync(cfgPath)) {
      throw new Error(`ormconfig.json not found at ${cfgPath}; ensure the app has generated it or set env vars`);
    }
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const cfg = JSON.parse(raw) as DataSourceOptions;
  const options: DataSourceOptions = { ...(cfg as any), synchronize: false } as DataSourceOptions;
    const ds = new DataSource(options);

    console.log('Initializing data source (ormconfig.json)...');
    await ds.initialize();

    console.log('Columns for permissions table:');
    const cols = await ds.query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'permissions'");
    console.table(cols);

    console.log('Sample row from permissions:');
    try {
      const row = await ds.query('SELECT * FROM permissions LIMIT 1');
      console.log(row);
    } catch (err) {
      console.error('query failed:', err && (err.message || err));
    }

    await ds.destroy();
  } catch (err) {
    console.error('Error', err && (err.message || err));
    process.exit(1);
  }
}

run();
