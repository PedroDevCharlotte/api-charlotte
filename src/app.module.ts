import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './Modules/Core/auth/auth.module';
import { UsersModule } from './Modules/Core/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './Modules/Database/Database.Module';
import { AccountModule } from './Modules/Core/Account/account.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, `../src/Configuration/.env`),
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AccountModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static Port: number;
  constructor(private readonly configService: ConfigService) {
    AppModule.Port = Number(this.configService.get('PORT') ?? 3000);
   
  }
}
