import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../src/Modules/Core/email/email.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: Partial<MailerService>;

  beforeEach(async () => {
    mailerService = {
      sendMail: jest.fn().mockResolvedValue({ accepted: ['test@x.com'] })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MailerService, useValue: mailerService },
        { provide: ConfigService, useValue: { get: () => 'http://localhost:3000' } }
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should send email with template successfully', async () => {
    await expect(service.sendEmailWithTemplate('test@x.com', 'sub', 'template', { foo: 'bar' })).resolves.toBeUndefined();
    expect((mailerService.sendMail as jest.Mock).mock.calls.length).toBe(1);
  });

  it('should throw error with descriptive message when mailer fails', async () => {
    (mailerService.sendMail as jest.Mock).mockRejectedValueOnce(new Error('SMTP auth failed'));
    await expect(service.sendEmailWithTemplate('test@x.com', 'sub', 'template', {})).rejects.toThrow(/Failed to send email with template/);
  });
});
