import { DataSource } from 'typeorm';
import { join } from 'path';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'CharlotteAdmin',
  password: '1234567',
  database: 'charlottecore',
  // use compiled glob by default; ProviderDBService writes ormconfig.json for runtime use
  entities: [join(__dirname, '../../dist/**/*.Entity.js')],
  migrations: [join(__dirname, '../../dist/Modules/Database/Migrations/*.js')],
  // synchronize should be disabled by default; enable it only via DB_SYNCHRONIZE='true' at runtime
  synchronize: (() => {
    const requested = process.env.DB_SYNCHRONIZE === 'true';
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production' && requested) {
      console.warn('DB_SYNCHRONIZE=true was ignored in production environment for safety.');
      return false;
    }
    return requested;
  })(),
  logging: true,
});
