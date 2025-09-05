import { TicketsService } from '../../../../src/Modules/Core/tickets/tickets.service';
import { NotFoundException } from '@nestjs/common';

// Create lightweight mock factory for repositories
const mockRepo = () => ({
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getMany: jest.fn().mockResolvedValue([]),
  }),
  save: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

describe('TicketsService (unit)', () => {
  let service: TicketsService;
  let ticketRepo: any;
  let participantRepo: any;
  let messageRepo: any;
  let historyRepo: any;
  let attachmentRepo: any;
  let userRepo: any;
  let ticketTypeRepo: any;
  const ticketNotificationService = { notifyTicketCreated: jest.fn(), notifyTicketAssigned: jest.fn() } as any;
  const graphService = {} as any;

  beforeEach(() => {
    ticketRepo = mockRepo();
    participantRepo = mockRepo();
    messageRepo = mockRepo();
    historyRepo = mockRepo();
    attachmentRepo = mockRepo();
    userRepo = mockRepo();
    ticketTypeRepo = mockRepo();

    service = new TicketsService(
      ticketRepo,
      participantRepo,
      messageRepo,
      historyRepo,
      attachmentRepo,
      userRepo,
      ticketTypeRepo,
      ticketNotificationService,
  graphService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getUsersByTicketType should throw NotFoundException when ticketType not found', async () => {
    ticketTypeRepo.findOne.mockResolvedValue(null);
    await expect(service.getUsersByTicketType(999, 1, 10)).rejects.toThrow(NotFoundException);
    expect(ticketTypeRepo.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
  });
});
