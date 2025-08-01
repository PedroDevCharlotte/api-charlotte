import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtener la configuración base para emails con logo
   */
  private getEmailBaseConfig() {
    return {
      logoUrl: this.configService.get('CHARLOTTE_LOGO_URL') || 'https://via.placeholder.com/200x80/007bff/ffffff?text=CHARLOTTE',
      year: new Date().getFullYear(),
      loginUrl: `${this.configService.get('FRONTEND_URL')}/login` || 'http://localhost:3000/login',
    };
  }

  async sendEmail(
    to: string,
    subject: string,
    text?: string,
    html?: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending email to: ${to}, subject: ${subject}`);
      
      const result = await this.mailerService.sendMail({
        to: to.trim(), // Remover espacios en blanco
        subject,
        text,
        html,
      });
      
      this.logger.log(`Email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending email:', error.message);
      this.logger.error('Full error:', error);
      
      // Proporcionar más información sobre el error
      if (error.message.includes('Invalid address')) {
        throw new Error(`Dirección de email inválida: ${to}`);
      } else if (error.message.includes('authentication')) {
        throw new Error('Error de autenticación con el servidor de correo');
      } else {
        throw new Error(`Error al enviar email: ${error.message}`);
      }
    }
  }

  async sendEmailWithTemplate(
    to: string,
    subject: string,
    template: string,
    context: any,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
    } catch (error) {
      console.error('Error sending email with template:', error);
      throw new Error('Failed to send email with template');
    }
  }

  // Ejemplo: Enviar email de bienvenida
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const subject = '¡Bienvenido a Charlotte Chemical!';
    
    try {
      await this.mailerService.sendMail({
        to: to.trim(),
        subject,
        template: 'welcome',
        context: {
          subject,
          userName,
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(`Welcome email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending welcome email:', error.message);
      throw new Error(`Error al enviar email de bienvenida: ${error.message}`);
    }
  }

  // Ejemplo: Enviar código de verificación
  async sendVerificationCode(to: string, code: string): Promise<void> {
    const subject = 'Código de Verificación - Charlotte Chemical';
    
    try {
      await this.mailerService.sendMail({
        to: to.trim(),
        subject,
        template: 'verification-code',
        context: {
          subject,
          userName: to.split('@')[0], // Usar la parte del email antes del @
          verificationCode: code,
          expirationMinutes: 10,
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(`Verification code sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending verification code:', error.message);
      throw new Error(`Error al enviar código de verificación: ${error.message}`);
    }
  }

  // Ejemplo: Enviar notificación de cambio de contraseña
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const subject = 'Restablecer contraseña';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <h2>Restablecer contraseña</h2>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para continuar:</p>
      <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Restablecer contraseña
      </a>
      <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
      <p>Este enlace expira en 1 hora.</p>
    `;

    await this.sendEmail(to, subject, undefined, html);
  }

  // Nuevo: Enviar código de restablecimiento de contraseña
  async sendPasswordResetCode(to: string, code: string, userName: string): Promise<void> {
    const subject = 'Código de Restablecimiento de Contraseña - Charlotte Chemical';
    
    try {
      await this.mailerService.sendMail({
        to: to.trim(),
        subject,
        template: 'password-reset-code',
        context: {
          subject,
          userName,
          resetCode: code,
          frontendUrl: this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(`Password reset code sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending password reset code:', error.message);
      throw new Error(`Error al enviar código de restablecimiento: ${error.message}`);
    }
  }

  // Nuevo: Confirmación de contraseña restablecida
  async sendPasswordResetConfirmation(to: string, userName: string): Promise<void> {
    const subject = 'Contraseña Restablecida Exitosamente - Charlotte Chemical';
    const now = new Date();
    
    try {
      await this.mailerService.sendMail({
        to: to.trim(),
        subject,
        template: 'password-reset-confirmation',
        context: {
          subject,
          userName,
          userEmail: to,
          resetDate: now.toLocaleDateString('es-MX'),
          resetTime: now.toLocaleTimeString('es-MX'),
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(`Password reset confirmation sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending password reset confirmation:', error.message);
      throw new Error(`Error al enviar confirmación de restablecimiento: ${error.message}`);
    }
  }
}
