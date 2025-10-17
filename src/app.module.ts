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
import { TicketFeedbackModule } from './Modules/Core/ticket-feedback/ticket-feedback.module';
import { GeneralListsModule } from './Modules/Core/general-lists/general-lists.module';
import { DataSeederService } from './data-seeder.service';
import { UserHierarchySeederService } from './Modules/user-hierarchy-seeder.service';
import { HierarchyTestController } from './hierarchy-test.controller';
import { Role } from './Modules/Core/roles/Entity/role.entity';
import { Department } from './Modules/Core/departments/Entity/department.entity';
import { User } from './Modules/Core/users/Entity/user.entity';
import { TicketType } from './Modules/Core/ticket-types/Entity/ticket-type.entity';
import { Ticket } from './Modules/Core/tickets/Entity/ticket.entity';
import { TicketFeedback } from './Modules/Core/ticket-feedback/Entity/ticket-feedback.entity';
import { Banner } from './Modules/Core/banners/Entity/banner.entity';
import { Favorite } from './Modules/Core/favorites/Entity/favorite.entity';
import { BannersModule } from './Modules/Core/banners/banners.module';
import { TicketParticipant } from './Modules/Core/tickets/Entity/ticket-participant.entity';
import { TicketMessage } from './Modules/Core/tickets/Entity/ticket-message.entity';
import { FavoritesModule } from './Modules/Core/favorites/favorites.module';
import { GeneralList } from './Modules/Core/general-lists/Entity/general-list.entity';
import { ListOption } from './Modules/Core/general-lists/Entity/list-option.entity';
import { EntityDefinition } from './Modules/Core/general-lists/Entity/entity.entity';
import { FieldDefinition } from './Modules/Core/general-lists/Entity/field-definition.entity';
import { NonConformity } from './Modules/Core/non-conformities/Entity/non-conformity.entity';
import { ActionPlan } from './Modules/Core/non-conformities/Entity/action-plan.entity';
import { FollowUp } from './Modules/Core/non-conformities/Entity/follow-up.entity';
import { WhyRecord } from './Modules/Core/non-conformities/Entity/why-record.entity';
import { NonConformitiesModule } from './Modules/Core/non-conformities/non-conformities.module';
import { Permission } from './Modules/Core/permissions/Entity/permission.entity';
import { PermissionsModule } from './Modules/Core/permissions/permissions.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      // Load .env from common locations so it works both when running TS (dev)
      // and when running compiled JS from dist. Try src/Configuration/.env first,
      // then fallback to project root .env.
      envFilePath: [
        join(process.cwd(), 'src/Configuration/.env'),
        join(process.cwd(), '.env'),
      ],
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
  TicketFeedback,
  Banner,
  Favorite,
      GeneralList,
      ListOption,
      EntityDefinition,
      FieldDefinition
  ,
  NonConformity,
  ActionPlan,
  FollowUp,
  WhyRecord,
  Permission
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
  PermissionsModule,
  TicketFeedbackModule,
  // Favorites module
  // lazy add
  // will import module below
  // Banners module for managing homepage banners
  BannersModule,
  GeneralListsModule
  , FavoritesModule
  , NonConformitiesModule
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
