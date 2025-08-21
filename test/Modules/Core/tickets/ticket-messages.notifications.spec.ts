import { Test, TestingModule } from '@nestjs/testing';
import { TicketMessagesService } from '../../../../src/Modules/Core/tickets/ticket-messages.service';
import { TicketsService } from '../../../../src/Modules/Core/tickets/tickets.service';
import { TicketNotificationService } from '../../../../src/Modules/Core/tickets/ticket-notification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketMessage } from '../../../../src/Modules/Core/tickets/Entity/ticket-message.entity';
import { TicketMessageRead } from '../../../../src/Modules/Core/tickets/Entity/ticket-message-read.entity';
import { TicketParticipant } from '../../../../src/Modules/Core/tickets/Entity/ticket-participant.entity';

describe('TicketMessages notifications and status transitions', () => {
  let service: TicketMessagesService;
  let ticketsService: Partial<TicketsService> & any;
  let notificationService: any;

  beforeEach(async () => {
    notificationService = {
      notifyTicketCommented: jest.fn().mockResolvedValue(undefined),
      notifyTicketStatusChanged: jest.fn().mockResolvedValue(undefined),
    };

    ticketsService = {
      findOne: jest.fn(),
      update: jest.fn(),
      buildEmailRecipients: jest.fn(),
      // inner properties accessed by TicketMessagesService
      userRepository: { findOne: jest.fn() },
      ticketNotificationService: notificationService,
      attachmentRepository: { save: jest.fn() }
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketMessagesService,
        { provide: TicketsService, useValue: ticketsService },
        { provide: TicketNotificationService, useValue: notificationService },
        { provide: getRepositoryToken(TicketMessage), useValue: { create: jest.fn(), save: jest.fn(), findOne: jest.fn() } },
        { provide: getRepositoryToken(TicketMessageRead), useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } },
  { provide: getRepositoryToken(TicketParticipant), useValue: { findOne: jest.fn().mockResolvedValue({ id: 1, ticketId: 1, userId: 10, role: 'COLLABORATOR', canComment: true, canEdit: false, canClose: false }), create: jest.fn(), save: jest.fn() } },
      ],
    }).compile();

    service = module.get<TicketMessagesService>(TicketMessagesService);
  });

  it('should set status to IN_PROGRESS when creator posts a message and call notification', async () => {
    const ticket = { id: 1, createdBy: 10, assignedTo: 20, status: 'OPEN' } as any;
    const currentUserId = 10; // creator

    // Mock ticketsService behavior
    ticketsService.findOne = jest.fn().mockResolvedValue(ticket);
    ticketsService.buildEmailRecipients = jest.fn().mockResolvedValue({ to: ['c@c.com'] });
    ticketsService.userRepository.findOne = jest.fn().mockResolvedValue({ id: currentUserId, email: 'u@u.com' });

    // Mock message repo save and findOne used by final findOne
    const messageRepo = (service as any).messageRepository;
    const savedMessage = { id: 5, ticketId: ticket.id, senderId: currentUserId, content: 'hello' };
    messageRepo.create = jest.fn().mockReturnValue(savedMessage);
    messageRepo.save = jest.fn().mockResolvedValue(savedMessage);
    // When service.findOne is called for return, return a fuller object
    jest.spyOn(service, 'findOne').mockResolvedValue({ ...savedMessage, sender: { id: currentUserId }, ticket } as any);

    // Mock ticketsService.update to set status
    ticketsService.update = jest.fn().mockImplementation(async (id: number, dto: any) => {
      ticket.status = dto.status;
      return { ...ticket };
    });

    // Act
    await service.create({ ticketId: ticket.id, content: 'hello' } as any, currentUserId);

    // Assert
    expect(ticketsService.update).toHaveBeenCalledWith(ticket.id, expect.objectContaining({ status: 'IN_PROGRESS' }), currentUserId);
    expect(notificationService.notifyTicketCommented).toHaveBeenCalled();
  });

  it('should set status to FOLLOW_UP when assignee posts a message and call notification', async () => {
    const ticket = { id: 2, createdBy: 11, assignedTo: 21, status: 'OPEN' } as any;
    const currentUserId = 21; // assignee

    ticketsService.findOne = jest.fn().mockResolvedValue(ticket);
    ticketsService.buildEmailRecipients = jest.fn().mockResolvedValue({ to: ['d@d.com'] });
    ticketsService.userRepository.findOne = jest.fn().mockResolvedValue({ id: currentUserId, email: 'assignee@a.com' });

    const messageRepo = (service as any).messageRepository;
    const savedMessage = { id: 6, ticketId: ticket.id, senderId: currentUserId, content: 'assignee note' };
    messageRepo.create = jest.fn().mockReturnValue(savedMessage);
    messageRepo.save = jest.fn().mockResolvedValue(savedMessage);
    jest.spyOn(service, 'findOne').mockResolvedValue({ ...savedMessage, sender: { id: currentUserId }, ticket } as any);

    ticketsService.update = jest.fn().mockImplementation(async (id: number, dto: any) => {
      ticket.status = dto.status;
      return { ...ticket };
    });

    await service.create({ ticketId: ticket.id, content: 'assignee note' } as any, currentUserId);

    expect(ticketsService.update).toHaveBeenCalledWith(ticket.id, expect.objectContaining({ status: 'FOLLOW_UP' }), currentUserId);
    expect(notificationService.notifyTicketCommented).toHaveBeenCalled();
  });
});
