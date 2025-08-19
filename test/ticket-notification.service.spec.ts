import { Test, TestingModule } from '@nestjs/testing';
import { TicketNotificationService } from '../src/Modules/Core/tickets/ticket-notification.service';
import { EmailService } from '../src/Modules/Core/email/email.service';
import { ConfigService } from '@nestjs/config';

const mockEmailService = {
  sendEmailWithTemplate: jest.fn().mockResolvedValue(undefined),
};

describe('TicketNotificationService', () => {
  let service: TicketNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketNotificationService,
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: { get: () => 'http://localhost:3000' } }
      ],
    }).compile();

    service = module.get<TicketNotificationService>(TicketNotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should filter invalid recipients and call emailService for valid ones', async () => {
    const context: any = {
      ticket: { ticketNumber: 'T-1', id: 1, title: 't', priority: 'MEDIUM', status: 'OPEN', createdAt: new Date().toISOString() },
      action: 'created',
      user: { id: 1, firstName: 'A', lastName: 'B', email: 'a@x.com' },
      recipients: {
        to: ['valid@x.com', '', 'invalid-email'],
        cc: ['cc@x.com', null]
      }
    };

    await service.notifyTicketCreated(context);

    // Should call sendEmailWithTemplate for 'valid@x.com' and for 'cc@x.com'
    expect(mockEmailService.sendEmailWithTemplate).toHaveBeenCalled();
    const calls = (mockEmailService.sendEmailWithTemplate as jest.Mock).mock.calls.map(c => c[0]);
    expect(calls).toContain('valid@x.com');
    expect(calls).toContain('cc@x.com');
    expect(calls).not.toContain('invalid-email');
  });
});
