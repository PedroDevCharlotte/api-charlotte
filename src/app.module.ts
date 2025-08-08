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
import { TicketTypesModule } from './Modules/Core/ticket-types/ticket-types.module';
import { TicketsModule } from './Modules/Core/tickets/tickets.module';
import { GeneralListsModule } from './Modules/Core/general-lists/general-lists.module';
import { DataSeederService } from './data-seeder.service';
import { UserHierarchySeederService } from './Modules/user-hierarchy-seeder.service';
import { HierarchyTestController } from './hierarchy-test.controller';
import { Role } from './Modules/Core/roles/Entity/role.entity';
import { Department } from './Modules/Core/departments/Entity/department.entity';
import { User } from './Modules/Core/users/Entity/user.entity';
import { TicketType } from './Modules/Core/ticket-types/Entity/ticket-type.entity';
import { Ticket } from './Modules/Core/tickets/Entity/ticket.entity';
import { TicketParticipant } from './Modules/Core/tickets/Entity/ticket-participant.entity';
import { TicketMessage } from './Modules/Core/tickets/Entity/ticket-message.entity';
import { GeneralList } from './Modules/Core/general-lists/Entity/general-list.entity';
import { ListOption } from './Modules/Core/general-lists/Entity/list-option.entity';
import { EntityDefinition } from './Modules/Core/general-lists/Entity/entity.entity';
import { FieldDefinition } from './Modules/Core/general-lists/Entity/field-definition.entity';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, `../src/Configuration/.env`),
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([
      Role, 
      Department, 
      User, 
      TicketType, 
      Ticket, 
      TicketParticipant, 
      TicketMessage,
      GeneralList,
      ListOption,
      EntityDefinition,
      FieldDefinition
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AccountModule,
    EmailModule,
    AuditModule,
    RolesModule,
    DepartmentsModule,
    TicketTypesModule,
    TicketsModule,
    GeneralListsModule
  ],
  controllers: [HierarchyTestController],
  providers: [DataSeederService, UserHierarchySeederService],
})
export class AppModule {
  static Port: number;
  constructor(private readonly configService: ConfigService) {
    AppModule.Port = Number(this.configService.get('PORT') ?? 3000);
   
  }
}
