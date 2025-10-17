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

    // Create a new options object (don't mutate the parsed cfg) and ensure migrations path points to compiled dist
    const options: DataSourceOptions = {
      ...(cfg as any),
      migrations: (cfg.migrations && (cfg.migrations as any).length) ? cfg.migrations : ['dist/Modules/Database/Migrations/*.js'],
      synchronize: false, // prevent accidental schema sync when running maintenance scripts
    } as DataSourceOptions;

    const ds = new DataSource(options);
    console.log('Initializing data source (ormconfig.json)...');
    await ds.initialize();
    console.log('Running migrations...');
    const res = await ds.runMigrations();
    console.log('Migrations result:', res);
    await ds.destroy();
    console.log('Done');
  } catch (err) {
    console.error('Migration error', err && (err.message || err));
    process.exit(1);
  }
}

run();
