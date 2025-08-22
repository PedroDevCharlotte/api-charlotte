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
  const ctx: any = {
      ticket: { ticketNumber: 'T-1', id: 1, title: 't', priority: 'MEDIUM', status: 'OPEN', createdAt: new Date().toISOString() },
      action: 'created',
      user: { id: 1, firstName: 'A', lastName: 'B', email: 'a@x.com' },
      recipients: {
        to: ['valid@x.com', '', 'invalid-email'],
        cc: ['cc@x.com', null]
      }
    };

  await service.notifyTicketCreated(ctx);

  // Should call sendEmailWithTemplate once with primary recipient 'valid@x.com'
  expect(mockEmailService.sendEmailWithTemplate).toHaveBeenCalledTimes(1);
  const call = (mockEmailService.sendEmailWithTemplate as jest.Mock).mock.calls[0];
  const primary = call[0];
  const emailCtx = call[3];
  expect(primary).toBe('valid@x.com');
  // CC should include the valid cc address
  expect(Array.isArray(emailCtx.cc) && emailCtx.cc).toContain('cc@x.com');
  // Ensure invalid entries are not present in cc
  expect(emailCtx.cc).not.toContain('invalid-email');
  });
});
