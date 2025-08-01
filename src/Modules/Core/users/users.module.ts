import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';
import { DepartmentsModule } from '../departments/departments.module';
import { PasswordTestController } from './password-test.controller';

@Module({
  providers: [UsersService],
  controllers: [ UserController, PasswordTestController ],
  exports: [UsersService],
  imports: [
    TypeOrmModule.forFeature([User]),
    EmailModule, // Importar EmailModule para usar EmailService
    AuditModule, // Importar AuditModule para usar AuditService
    RolesModule, // Importar RolesModule para acceder a los roles
    DepartmentsModule, // Importar DepartmentsModule para acceder a los departamentos
  ],
})
export class UsersModule {  

}
