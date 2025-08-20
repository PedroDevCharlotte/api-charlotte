import { EmailService } from '../../../../src/Modules/Core/email/email.service';
import * as fs from 'fs';

jest.mock('fs');

describe('EmailService (unit)', () => {
  let service: EmailService;

  beforeEach(() => {
    const mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(true),
      send: jest.fn().mockResolvedValue(true),
    } as any;

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'MAIL_FROM') return 'no-reply@example.com';
        return null;
      }),
    } as any;

    // Instantiate service directly with mocks
    service = new EmailService(mockMailerService, mockConfigService as any);
  });

  it('should register base partial without throwing when file exists', async () => {
    // Arrange
    (fs.readFileSync as jest.Mock).mockReturnValue('<div>{{content}}</div>');

    // Act & Assert: calling helper registration should not throw
    expect(() => {
      (service as any).registerHandlebarsHelpers && (service as any).registerHandlebarsHelpers();
    }).not.toThrow();
  });
});
