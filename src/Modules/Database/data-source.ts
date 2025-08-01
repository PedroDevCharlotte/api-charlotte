import { DataSource } from 'typeorm';
import { join } from 'path';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'CharlotteAdmin',
  password: '1234567',
  database: 'charlottecore',
  entities: [join(__dirname, '../**/*.Entity{.ts,.js}')],
  migrations: [join(__dirname, 'Migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});
