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
    Handlebars.registerHelper('eq', function (a: any, b: any) {
      return a === b;
    });

    // Helper para comparación mayor que
    Handlebars.registerHelper('gt', function (a: any, b: any) {
      return a > b;
    });

    // Helper para comparación menor que
    Handlebars.registerHelper('lt', function (a: any, b: any) {
      return a < b;
    });

    // Helper para convertir saltos de línea en HTML
    Handlebars.registerHelper('breaklines', function (text: string) {
      if (!text) return '';
      text = Handlebars.escapeExpression(text);
      text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
      return new Handlebars.SafeString(text);
    });

    // Helper para obtener substring
    Handlebars.registerHelper(
      'substring',
      function (str: string, start: number, length?: number) {
        if (!str) return '';
        if (length !== undefined) {
          return str.substring(start, start + length);
        }
        return str.substring(start);
      },
    );

    // Helper para formatear fechas
    Handlebars.registerHelper('formatDate', function (date: Date | string) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Mexico_City',
      });
    });

    // Helper para formatear fechas cortas
    Handlebars.registerHelper(
      'formatDateShort',
      function (date: Date | string) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'America/Mexico_City',
        });
      },
    );

    // Helper para capitalizar texto
    Handlebars.registerHelper('capitalize', function (str: string) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Helper para comprobar si un partial está registrado (útil para renderizar inline partials)
    Handlebars.registerHelper('partialExists', function (name: string) {
      try {
        return Boolean(
          (Handlebars as any).partials && (Handlebars as any).partials[name],
        );
      } catch (err) {
        return false;
      }
    });

    // Note: templates are now standalone full HTML files. We no longer auto-register
    // a 'base' partial here because templates should be self-contained and avoid
    // relying on partial ordering or external composition.
  }

  /**
   * Obtener la configuración base para emails con logo
   */
  private getEmailBaseConfig() {
    return {
      logoUrl:
        this.configService.get('CHARLOTTE_LOGO_URL') ||
        'https://via.placeholder.com/200x80/007bff/ffffff?text=CHARLOTTE',
      year: new Date().getFullYear(),
      // frontendUrl used by templates for CTAs (feedback, ticket details)
      frontendUrl:
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000',
      // keep loginUrl for backward compatibility
      loginUrl:
        `${this.configService.get('FRONTEND_URL')}/login` ||
        'http://localhost:3000/login',
      // optional support email
      supportEmail:
        this.configService.get<string>('CHARLOTTE_SUPPORT_EMAIL') || undefined,
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
      console.log(
        '---------------------Enviando email con template start----------------',
      );
      console.log(to, subject, template, context);
      console.log(
        '---------------------Enviando email con template End----------------',
      );
      // Ensure template context always contains the subject and base values
      const safeContext = Object.assign(
        {},
        this.getEmailBaseConfig(),
        context || {},
      );
      if (!safeContext.subject) safeContext.subject = subject;
      // Provide common safe defaults used by many templates to avoid Handlebars missing-variable errors
      if (safeContext.content === undefined) safeContext.content = '';
      // Keep ticket minimal default; do not coerce caller primitives into objects here.
      if (safeContext.ticket === undefined) safeContext.ticket = {};
      if (safeContext.user === undefined)
        safeContext.user = { id: null, firstName: '', lastName: '', email: '' };
      if (safeContext.attachments === undefined) safeContext.attachments = [];
      if (safeContext.action === undefined) safeContext.action = '';

      // Ensure templates receive a `systemInfo` object (many templates reference systemInfo.*)
      try {
        const baseSystemInfo = this.getEmailBaseConfig();
        safeContext.systemInfo = Object.assign(
          {},
          baseSystemInfo,
          (context && context.systemInfo) || {},
        );
        // preserve logoData if caller provided it at top-level or inside systemInfo
        if (!safeContext.systemInfo.logoData) {
          if (context && context.logoData)
            safeContext.systemInfo.logoData = context.logoData;
          else if (context && context.systemInfo && context.systemInfo.logoData)
            safeContext.systemInfo.logoData = context.systemInfo.logoData;
        }
      } catch (err) {
        // non-fatal: templates can still render with defaults
        this.logger.debug(
          'Could not build systemInfo for email context:',
          err?.message || err,
        );
        if (!safeContext.systemInfo)
          safeContext.systemInfo = this.getEmailBaseConfig();
      }

      // Note: templates should use `user.firstName` and `user.lastName`.
      // We intentionally avoid injecting or mutating a `user.fullName` property here.

      // Ensure ticket.url exists for CTA links used by templates (fallback to frontend /apps/ticket/details/:id)
      try {
        const frontend =
          (safeContext.systemInfo && safeContext.systemInfo.frontendUrl) ||
          this.configService.get('FRONTEND_URL') ||
          'http://localhost:3000';
        if (
          safeContext.ticket &&
          !safeContext.ticket.url &&
          safeContext.ticket.id
        ) {
          safeContext.ticket.url = `${frontend.replace(/\/$/, '')}/apps/ticket/details/${safeContext.ticket.id}`;
        }
      } catch (err) {
        this.logger.debug(
          'Could not build ticket.url for email context:',
          err?.message || err,
        );
      }

      // Note: message fragment pre-rendering removed. Templates should include
      // the message content via the `content` context property provided by callers.

      // If logoData is not present, try to read the logo from public/images/logos and embed as data URI
      try {
        const fs = require('fs');
        const path = require('path');
        if (
          safeContext.systemInfo &&
          !safeContext.systemInfo.logoData &&
          safeContext.systemInfo.logoUrl
        ) {
          const logoUrl: string = safeContext.systemInfo.logoUrl;
          let candidatePath: string | undefined;
          try {
            const maybeUrl = new URL(logoUrl);
            if (
              maybeUrl.pathname &&
              maybeUrl.pathname.indexOf('/images/') === 0
            ) {
              candidatePath = path.join(process.cwd(), maybeUrl.pathname);
            }
          } catch (err) {
            if (logoUrl.indexOf('/') === 0) {
              candidatePath = path.join(process.cwd(), logoUrl);
            }
          }
          if (!candidatePath) {
            const fileName = path.basename(decodeURIComponent(logoUrl));
            candidatePath = path.join(
              process.cwd(),
              'public',
              'images',
              'logos',
              fileName,
            );
          }
          if (candidatePath && fs.existsSync(candidatePath)) {
            const buffer = fs.readFileSync(candidatePath);
            const ext = path
              .extname(candidatePath)
              .toLowerCase()
              .replace('.', '');
            const mime =
              ext === 'svg'
                ? 'image/svg+xml'
                : ext === 'png'
                  ? 'image/png'
                  : ext === 'jpg' || ext === 'jpeg'
                    ? 'image/jpeg'
                    : 'application/octet-stream';
            safeContext.systemInfo.logoData = `data:${mime};base64,${buffer.toString('base64')}`;
          }
        }
      } catch (err) {
        this.logger.debug(
          'Could not embed logo as data URI:',
          err?.message || err,
        );
      }

      // Helpful debug logging when template errors occurred previously
      this.logger.debug(
        `Email template '${template}' context keys: ${Object.keys(safeContext).join(', ')}`,
      );

      // prepare attachments if provided in context (look for filePath)
      const mailOptions: any = {
        to: (to || '').trim(),
        subject,
        template,
        context: safeContext,
      };

      // Pre-render check removed: avoid mutating caller context at render-time.
      // Let the mailer/Handlebars surface template/runtime errors upstream.

      try {
        const fs = require('fs');
        if (
          Array.isArray(safeContext.attachments) &&
          safeContext.attachments.length > 0
        ) {
          const mailAttachments: any[] = [];
          for (const a of safeContext.attachments) {
            if (a && a.filePath && fs.existsSync(a.filePath)) {
              mailAttachments.push({
                filename: a.originalFileName || a.fileName || a.filename,
                path: a.filePath,
              });
            }
          }
          if (mailAttachments.length) mailOptions.attachments = mailAttachments;
        }
      } catch (err) {
        this.logger.debug(
          'Error preparing attachments for email:',
          err?.message || err,
        );
      }

      // Final sanitization removed: avoid implicit coercions of primitives to objects here.

      // Before sending, verify that template file exists and can be compiled by Handlebars.
      // declare templateFile in parent scope so fallback rendering can access it
      let templateFile: string | undefined;
      try {
        const fs = require('fs');
        const path = require('path');

        // Candidate locations where templates may live depending on runtime (dev vs build)
        const candidates = [
          path.join(__dirname, 'templates', `${template}.hbs`),
          // When running from a built project the dist may contain compiled files — keep this candidate
          path.join(
            process.cwd(),
            'dist',
            'src',
            'Modules',
            'Core',
            'email',
            'templates',
            `${template}.hbs`,
          ),
          // Source locations used during development
          path.join(
            process.cwd(),
            'src',
            'Modules',
            'Core',
            'email',
            'templates',
            `${template}.hbs`,
          ),
          path.join(
            process.cwd(),
            'src',
            'modules',
            'core',
            'email',
            'templates',
            `${template}.hbs`,
          ),
        ];

        for (const c of candidates) {
          try {
            if (fs.existsSync(c)) {
              templateFile = c;
              break;
            }
          } catch (e) {
            // ignore and continue to next candidate
          }
        }

        if (!templateFile) {
          const msg = `Email template file not found. Tried: ${candidates.join('; ')}`;
          this.logger.error(msg);
          throw new Error(msg);
        }

        // Try reading and compiling the template to surface syntax errors early
        try {
          const raw = fs.readFileSync(templateFile, 'utf8');
          // Handlebars.precompile returns a string; compile to check syntax
          Handlebars.compile(raw);
        } catch (compileErr) {
          const msg = `Failed to compile email template '${template}' at ${templateFile}: ${compileErr?.message || compileErr}`;
          this.logger.error(msg);
          throw new Error(msg);
        }
      } catch (checkErr) {
        // Re-throw so the outer catch reports a clear message
        throw checkErr;
      }

      // Send email using configured mailer service
      // Debug rendering to disk has been removed; use the mailerService to actually send emails.
      try {
        this.logger.debug(
          `Attempting to send email with template file: ${templateFile}`,
        );
        await this.mailerService.sendMail(mailOptions);
      } catch (mailerErr) {
        // Some versions of the handlebars adapter return an unclear error when precompile fails
        // (e.g. "Cannot destructure property 'templateName' of 'precompile(...)' as it is undefined.").
        // If that happens, attempt a graceful fallback: render the template manually and send as html.
        try {
          const fs = require('fs');
          const path = require('path');
          this.logger.warn(
            'Mailer adapter failed, attempting manual template render fallback',
            mailerErr?.message || mailerErr,
          );
          if (typeof templateFile === 'string' && fs.existsSync(templateFile)) {
            const raw = fs.readFileSync(templateFile, 'utf8');
            const compiled = Handlebars.compile(raw);
            const rendered = compiled(safeContext);

            const fallbackMail: any = {
              to: (to || '').trim(),
              subject,
              html: rendered,
            };
            if (mailOptions.attachments)
              fallbackMail.attachments = mailOptions.attachments;

            await this.mailerService.sendMail(fallbackMail);
            this.logger.log(
              `Email sent using manual render fallback for template '${template}' to ${to}`,
            );
            return;
          } else {
            this.logger.error(
              'Manual render fallback: template file not found at expected path',
              templateFile,
            );
          }
        } catch (fallbackErr) {
          this.logger.error(
            'Manual render fallback also failed:',
            fallbackErr?.message || fallbackErr,
          );
          // fall through to throw original error below
        }

        this.logger.error(
          'Error sending email with template:',
          mailerErr?.message || mailerErr,
        );

        console.log(
          'Error en el envío del email con template',
          mailerErr?.message || mailerErr,
        );
        this.logger.error('Template send error full:', mailerErr);
        // Rethrow with original message for better diagnostics upstream
        throw new Error(
          `Failed to send email with template '${template}' to '${to}': ${mailerErr?.message || mailerErr}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Error sending email with template:',
        error?.message || error,
      );

      console.log(
        'Error en el envío del email con template',
        error?.message || error,
      );
      this.logger.error('Template send error full:', error);
      // Rethrow with original message for better diagnostics upstream
      throw new Error(
        `Failed to send email with template '${template}' to '${to}': ${error?.message || error}`,
      );
    }
  }

  // Ejemplo: Enviar email de bienvenida
  async sendWelcomeEmail(
    to: string,
    userName: string,
    userEmail?: string,
    temporaryPassword?: string,
  ): Promise<void> {
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
      throw new Error(
        `Error al enviar código de verificación: ${error.message}`,
      );
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
  async sendPasswordResetCode(
    to: string,
    code: string,
    userName: string,
  ): Promise<void> {
    const subject =
      'Código de Restablecimiento de Contraseña - Charlotte Chemical';

    try {
      await this.mailerService.sendMail({
        to: to.trim(),
        subject,
        template: 'password-reset-code',
        context: {
          subject,
          userName,
          resetCode: code,
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(`Password reset code sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error('Error sending password reset code:', error.message);
      throw new Error(
        `Error al enviar código de restablecimiento: ${error.message}`,
      );
    }
  }

  // Nuevo: Confirmación de contraseña restablecida
  async sendPasswordResetConfirmation(
    to: string,
    userName: string,
  ): Promise<void> {
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

      this.logger.log(
        `Password reset confirmation sent successfully to: ${to}`,
      );
    } catch (error) {
      this.logger.error(
        'Error sending password reset confirmation:',
        error.message,
      );
      throw new Error(
        `Error al enviar confirmación de restablecimiento: ${error.message}`,
      );
    }
  }

  /**
   * Enviar notificación de cambio de contraseña con nuevas credenciales
   */
  async sendPasswordChangeNotification(
    to: string,
    userName: string,
    newPassword: string,
  ): Promise<void> {
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

      this.logger.log(
        `Password change notification sent successfully to: ${to}`,
      );
    } catch (error) {
      this.logger.error(
        'Error sending password change notification:',
        error.message,
      );
      throw new Error(
        `Error al enviar notificación de cambio de contraseña: ${error.message}`,
      );
    }
  }

  /**
   * Enviar notificación de eliminación de cuenta
   */
  async sendAccountDeletionNotification(
    to: string,
    userName: string,
    reason: string = 'Eliminación solicitada por administrador',
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
            timeZone: 'America/Mexico_City',
          }),
          reason,
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(
        `Account deletion notification sent successfully to: ${to}`,
      );
    } catch (error) {
      this.logger.error(
        'Error sending account deletion notification:',
        error.message,
      );
      throw new Error(
        `Error al enviar notificación de eliminación de cuenta: ${error.message}`,
      );
    }
  }

  /**
   * Enviar notificación de advertencia de expiración de contraseña
   */
  async sendPasswordExpirationWarning(
    to: string,
    userName: string,
    daysRemaining: number,
    customMessage: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Sending password expiration warning to: ${to} (${daysRemaining} days remaining)`,
      );

      const subject =
        daysRemaining === 0
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
          urgencyLevel:
            daysRemaining === 0
              ? 'critical'
              : daysRemaining === 1
                ? 'urgent'
                : daysRemaining <= 3
                  ? 'high'
                  : 'medium',
          changePasswordUrl:
            `${this.configService.get('FRONTEND_URL')}/forgot-password` ||
            'http://localhost:3000/forgot-password',
          ...this.getEmailBaseConfig(),
        },
      });

      this.logger.log(
        `Password expiration warning sent successfully to: ${to}`,
      );
    } catch (error) {
      this.logger.error(
        'Error sending password expiration warning:',
        error.message,
      );
      throw new Error(
        `Error al enviar advertencia de expiración de contraseña: ${error.message}`,
      );
    }
  }
}
