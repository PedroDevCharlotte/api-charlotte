import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AuthModule } from './Modules/Core/auth/auth.module';
import { UsersModule } from './Modules/Core/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './Modules/Database/Database.Module';
import { AccountModule } from './Modules/Core/Account/account.module';
import { EmailModule } from './Modules/Core/email/email.module';
import { AuditModule } from './Modules/Core/audit/audit.module';
import { RolesModule } from './Modules/Core/roles/roles.module';
import { DepartmentsModule } from './Modules/Core/departments/departments.module';
import { DataSeederService } from './data-seeder.service';
import { Role } from './Modules/Core/roles/Entity/role.entity';
import { Department } from './Modules/Core/departments/Entity/department.entity';
import { User } from './Modules/Core/users/Entity/user.entity';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, `../src/Configuration/.env`),
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([Role, Department, User]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AccountModule,
    EmailModule,
    AuditModule,
    RolesModule,
    DepartmentsModule
  ],
  controllers: [],
  providers: [DataSeederService],
})
export class AppModule {
  static Port: number;
  constructor(private readonly configService: ConfigService) {
    AppModule.Port = Number(this.configService.get('PORT') ?? 3000);
   
  }
}
