import { DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { writeFileSync } from 'fs';
import { Environment } from '../../Common/Enum/Environment.Enum';

async function createOrmConfigFile(dbConfig: DataSourceOptions) {
  const path = join(__dirname, '../../../ormconfig.json');
  writeFileSync(path, JSON.stringify(dbConfig, null, 2));
}

export const ProviderDBService: DynamicModule = TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  async useFactory(config: ConfigService) {
    const isDevelopmentEnv = config.get('NODE_ENV') !== Environment.Production;

    const dbConfig = {
      type: 'mysql',
      host: config.get('DB_HOST'),
      port: +config.get('DB_PORT'),
      username: config.get('DB_USER'),
      password: config.get('DB_PASSWORD'),
      database: config.get('DB_NAME'),
      autoLoadEntities: true,
      synchronize: true,
      migrations: ['dist/Modules/Database/Migrations/*.js'],
      entities: ['dist/**/*.Entity.js'],
      migrationsTableName: '', 
      cli: {
        migrationsDir: '../../Modules/Database/Migrations',
      },
      // ssl: {
      //   rejectUnauthorized: false,
      // },
      logging: 'all',
    } as DataSourceOptions;

    if (isDevelopmentEnv) {
      createOrmConfigFile(dbConfig);
    }
    return dbConfig;
  },
});
