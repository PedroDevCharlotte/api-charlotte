import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    // Registrar helpers personalizados para Handlebars
    this.registerHandlebarsHelpers();
  }

  /**
   * Registrar helpers personalizados para las plantillas
   */
  private registerHandlebarsHelpers() {
    // Helper para comparación de igualdad
    Handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b;
    });

    // Helper para comparación mayor que
    Handlebars.registerHelper('gt', function(a: any, b: any) {
      return a > b;
    });

    // Helper para comparación menor que
    Handlebars.registerHelper('lt', function(a: any, b: any) {
      return a < b;
    });

    // Helper para convertir saltos de línea en HTML
    Handlebars.registerHelper('breaklines', function(text: string) {
      if (!text) return '';
      text = Handlebars.escapeExpression(text);
      text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
      return new Handlebars.SafeString(text);
    });

    // Helper para obtener substring
    Handlebars.registerHelper('substring', function(str: string, start: number, length?: number) {
      if (!str) return '';
      if (length !== undefined) {
        return str.substring(start, start + length);
      }
      return str.substring(start);
    });

    // Helper para formatear fechas
    Handlebars.registerHelper('formatDate', function(date: Date | string) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Mexico_City'
      });
    });

    // Helper para formatear fechas cortas
    Handlebars.registerHelper('formatDateShort', function(date: Date | string) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Mexico_City'
      });
    });

    // Helper para capitalizar texto
    Handlebars.registerHelper('capitalize', function(str: string) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Registrar partials básicos (por ejemplo 'base') leyendo archivos desde templates
    try {
      const fs = require('fs');
      const path = require('path');
      const partialPath = path.join(__dirname, 'templates', 'base.hbs');
      if (fs.existsSync(partialPath)) {
        const basePartial = fs.readFileSync(partialPath, 'utf8');
        Handlebars.registerPartial('base', basePartial);
      }
    } catch (err) {
      this.logger.warn('Could not register handlebars partials automatically:', err?.message || err);
    }
  }

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
  this.logger.error('Error sending email with template:', error?.message || error);
  this.logger.error('Template send error full:', error);
  // Rethrow with original message for better diagnostics upstream
  throw new Error(`Failed to send email with template '${template}' to '${to}': ${error?.message || error}`);
    }
  }

  // Ejemplo: Enviar email de bienvenida
  async sendWelcomeEmail(to: string, userName: string, userEmail?: string, temporaryPassword?: string): Promise<void> {
    const subject = '¡Bienvenido a Charlotte Chemical!';
    
    try {
      await this.mailerService.sendMail({
        to: to.trim(),
        subject,
        template: 'welcome',
        context: {
          subject,
          userName,
          userEmail: userEmail || to, // Si no se proporciona userEmail, usar 'to'
          temporaryPassword: temporaryPassword || '***No proporcionada***',
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

  /**
   * Enviar notificación de cambio de contraseña con nuevas credenciales
   */
  async sendPasswordChangeNotification(to: string, userName: string, newPassword: string): Promise<void> {
    const subject = 'Tu contraseña ha sido actualizada - Charlotte Chemical';
    
    try {
      await this.mailerService.sendMail({
        to: to.trim(),
        subject,
        template: 'welcome', // Reutilizamos el template de bienvenida
        context: {
          subject,
          userName,
          userEmail: to,
          temporaryPassword: newPassword,
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(`Password change notification sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending password change notification:', error.message);
      throw new Error(`Error al enviar notificación de cambio de contraseña: ${error.message}`);
    }
  }

  /**
   * Enviar notificación de eliminación de cuenta
   */
  async sendAccountDeletionNotification(
    to: string, 
    userName: string, 
    reason: string = 'Eliminación solicitada por administrador'
  ): Promise<void> {
    const subject = 'Tu cuenta ha sido eliminada - Charlotte Chemical';
    
    try {
      await this.mailerService.sendMail({
        to: to.trim(),
        subject,
        template: 'account-deletion',
        context: {
          subject,
          userName,
          userEmail: to,
          deletionDate: new Date().toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Mexico_City'
          }),
          reason,
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(`Account deletion notification sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending account deletion notification:', error.message);
      throw new Error(`Error al enviar notificación de eliminación de cuenta: ${error.message}`);
    }
  }

  /**
   * Enviar notificación de advertencia de expiración de contraseña
   */
  async sendPasswordExpirationWarning(
    to: string,
    userName: string,
    daysRemaining: number,
    customMessage: string
  ): Promise<void> {
    try {
      this.logger.log(`Sending password expiration warning to: ${to} (${daysRemaining} days remaining)`);

      const subject = daysRemaining === 0 
        ? '🚨 Su contraseña ha vencido - Acción requerida'
        : daysRemaining === 1 
        ? '⚠️ Su contraseña vence mañana - Acción urgente'
        : `⏰ Su contraseña vence en ${daysRemaining} días`;

      await this.mailerService.sendMail({
        to: to.trim(),
        subject,
        template: 'password-expiration-warning',
        context: {
          userName: userName.trim(),
          daysRemaining,
          isExpired: daysRemaining <= 0,
          isExpiringTomorrow: daysRemaining === 1,
          customMessage,
          urgencyLevel: daysRemaining === 0 ? 'critical' : 
                       daysRemaining === 1 ? 'urgent' : 
                       daysRemaining <= 3 ? 'high' : 'medium',
          changePasswordUrl: `${this.configService.get('FRONTEND_URL')}/forgot-password` || 'http://localhost:3000/forgot-password',
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(`Password expiration warning sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending password expiration warning:', error.message);
      throw new Error(`Error al enviar advertencia de expiración de contraseña: ${error.message}`);
    }
  }
}
