import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Ticket } from './Entity/ticket.entity';
import { TicketParticipant } from './Entity/ticket-participant.entity';
import { TicketMessage } from './Entity/ticket-message.entity';
import { TicketMessageRead } from './Entity/ticket-message-read.entity';
import { TicketAttachment } from './Entity/ticket-attachment.entity';
import { TicketHistory } from './Entity/ticket-history.entity';
import { TicketType } from '../ticket-types/Entity/ticket-type.entity';
import { User } from '../users/Entity/user.entity';

// Services
import { TicketsService } from './tickets.service';
import { TicketMessagesService } from './ticket-messages.service';
import { TicketParticipantsService } from './ticket-participants.service';
import { TicketNotificationService } from './ticket-notification.service';

// Controllers
import { TicketsController } from './tickets.controller';
import { TicketMessagesController, MessagesController } from './ticket-messages.controller';
import { TicketParticipantsController, ParticipantsController } from './ticket-participants.controller';

// Other modules
import { UsersModule } from '../users/users.module';
import { DepartmentsModule } from '../departments/departments.module';
import { TicketTypesModule } from '../ticket-types/ticket-types.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketParticipant,
      TicketMessage,
      TicketMessageRead,
      TicketAttachment,
      TicketHistory,
      TicketType,
      User,
    ]),
    // Importar otros módulos necesarios
    forwardRef(() => UsersModule),
    forwardRef(() => DepartmentsModule),
    forwardRef(() => TicketTypesModule),
    forwardRef(() => EmailModule),
  ],
  controllers: [
    TicketsController,
    TicketMessagesController,
    MessagesController,
    TicketParticipantsController,
    ParticipantsController,
  ],
  providers: [
    TicketsService,
    TicketMessagesService,
    TicketParticipantsService,
    TicketNotificationService,
  ],
  exports: [
    TicketsService,
    TicketMessagesService,
    TicketParticipantsService,
    TicketNotificationService,
  ],
})
export class TicketsModule {}
