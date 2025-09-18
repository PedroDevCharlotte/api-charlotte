import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketFeedback } from './Entity/ticket-feedback.entity';
import { CreateTicketFeedbackDto } from './dto/create-ticket-feedback.dto';
import { Ticket, TicketStatus } from '../tickets/Entity/ticket.entity';
import { TicketHistory, HistoryAction } from '../tickets/Entity/ticket-history.entity';

@Injectable()
export class TicketFeedbackService {
  constructor(
    @InjectRepository(TicketFeedback)
    private readonly repo: Repository<TicketFeedback>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async create(dto: CreateTicketFeedbackDto, userId?: number) {
    // run in a transaction: save feedback and update ticket status to COMPLETED
    const ticketIdNum = Number(dto.ticketId);
    if (Number.isNaN(ticketIdNum)) {
      throw new NotFoundException('Invalid ticket id');
    }

    return this.repo.manager.transaction(async (manager) => {
      // ensure ticket exists
      const ticket = await manager.findOne(Ticket, { where: { id: ticketIdNum } });
      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      const entity = manager.create(TicketFeedback, {
        ticketId: dto.ticketId,
        knowledge: dto.knowledge,
        timing: dto.timing,
        escalation: dto.escalation,
        resolved: dto.resolved,
        comment: dto.comment,
      });

      const saved = await manager.save(entity);

      // update ticket status to COMPLETED if it's not already
      if (ticket.status !== TicketStatus.COMPLETED) {
        const oldStatus = ticket.status;
        ticket.status = TicketStatus.COMPLETED;
        await manager.save(ticket);

        // create ticket history record for status change
        const history = manager.create(TicketHistory, {
          ticket: ticket,
          ticketId: ticket.id,
          userId: userId ?? undefined,
          action: HistoryAction.STATUS_CHANGED,
          oldValues: { status: oldStatus },
          newValues: { status: TicketStatus.COMPLETED },
          description: `Ticket marcado como COMPLETED por encuesta`,
          metadata: {}
        });

        await manager.save(history);
      }

      return saved;
    });
  }

  async findByTicket(ticketId: string) {
    return this.repo.find({ where: { ticketId } });
  }

  async existsForTicket(ticketId: string) {
    const count = await this.repo.count({ where: { ticketId } });
    return count > 0;
  }
}
