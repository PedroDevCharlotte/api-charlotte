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
    console.log('Populating modulePath for existing permissions...');

    const queries = [
      `UPDATE permissions SET modulePath = '/apps/banners' WHERE name LIKE 'banners.%' OR name LIKE 'banner.%'`,
      `UPDATE permissions SET modulePath = '/apps/kanban' WHERE name LIKE 'kanban.%'`,
      `UPDATE permissions SET modulePath = '/apps/non-conformities' WHERE name LIKE 'non-conformities.%' OR name LIKE 'nonconformities.%' OR name LIKE 'non_conformities.%'`,
      `UPDATE permissions SET modulePath = '/apps/profiles' WHERE name LIKE 'profiles.%' OR name LIKE 'profile.%'`,
      `UPDATE permissions SET modulePath = '/apps/role-types' WHERE name LIKE 'role-types.%' OR name LIKE 'roletypes.%' OR name LIKE 'roles.%'`,
      `UPDATE permissions SET modulePath = '/apps/ticket' WHERE name LIKE 'ticket.%' OR name LIKE 'tickets.%'`,
      `UPDATE permissions SET modulePath = '/apps/user' WHERE name LIKE 'user.%' OR name LIKE 'users.%'`,
      `UPDATE permissions SET modulePath = '/apps' WHERE modulePath IS NULL`
    ];

    for (const q of queries) {
      try {
        const res = await ds.query(q);
        console.log('Executed:', q);
      } catch (err) {
        console.warn('Query failed:', q, err && err.message);
      }
    }

    console.log('Done updating permissions.');
    await ds.destroy();
  } catch (err) {
    console.error('Script failed', err && (err.message || err));
    process.exit(1);
  }
}

run();
