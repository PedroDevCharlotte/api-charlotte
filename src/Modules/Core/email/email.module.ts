import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailTestController } from './email-test.controller';

@Module({
  imports: [
    ConfigModule, // Asegurar que ConfigModule esté disponible
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const path = require('path');
        const fs = require('fs');
        // candidate locations in order of preference
        const cand1 = path.join(process.cwd(), 'dist', 'src', 'Modules', 'Core', 'email', 'templates');
        const cand2 = path.join(process.cwd(), 'dist', 'Modules', 'Core', 'email', 'templates');
        const defaultDir = path.join(__dirname, 'templates');
  const templateDir = fs.existsSync(cand1) ? cand1 : fs.existsSync(cand2) ? cand2 : defaultDir;
  console.log(`Mailer templates directory resolved to: ${templateDir}`);
        return {
        transport: {
          host: configService.get('MAIL_HOST') || 'smtp.gmail.com',
          port: parseInt(configService.get('MAIL_PORT') || '587'),
          secure: false, // false para 587, true para 465
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASS'),
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
          },
          // Configuración específica para Office365
          requireTLS: true,
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 10000,
        },
        defaults: {
          from: configService.get('MAIL_FROM') || configService.get('MAIL_USER'),
        },
        template: {
          // Use resolved templateDir (preferring dist paths) to avoid adapter path issues
          dir: templateDir,
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      };
    },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  controllers: [EmailController, EmailTestController],
  exports: [EmailService],
})
export class EmailModule {}
