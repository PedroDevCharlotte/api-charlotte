import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketFeedback } from './Entity/ticket-feedback.entity';
import { Ticket } from '../tickets/Entity/ticket.entity';
import { TicketFeedbackService } from './ticket-feedback.service';
import { TicketFeedbackController } from './ticket-feedback.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TicketFeedback, Ticket])],
  providers: [TicketFeedbackService],
  controllers: [TicketFeedbackController],
  exports: [TicketFeedbackService],
})
export class TicketFeedbackModule {}
