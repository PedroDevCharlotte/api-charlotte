import { Body, Controller, Post, UsePipes, ValidationPipe, UseGuards, Request } from '@nestjs/common';
import { TicketFeedbackService } from './ticket-feedback.service';
import { CreateTicketFeedbackDto } from './dto/create-ticket-feedback.dto';
// Use project's AuthGuard for route protection
import { AuthGuard } from '../../../Common/Auth/auth.guard';
import { Param, Get } from '@nestjs/common';

@Controller('ticket-feedback')
export class TicketFeedbackController {
  constructor(private readonly service: TicketFeedbackService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Request() req: any, @Body() dto: CreateTicketFeedbackDto) {
    const userId = req?.user?.id;
    return this.service.create(dto, userId);
  }

  @UseGuards(AuthGuard)
  @Get(':ticketId')
  async exists(@Param('ticketId') ticketId: string) {
    const exists = await this.service.existsForTicket(ticketId);
    return { ticketId, exists };
  }
}
