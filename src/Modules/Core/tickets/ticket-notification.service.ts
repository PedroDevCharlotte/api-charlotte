import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { Ticket, TicketStatus } from './Entity/ticket.entity';
import { TicketMessage } from './Entity/ticket-message.entity';
import { TicketAttachment } from './Entity/ticket-attachment.entity';
import { User } from '../users/Entity/user.entity';

export interface TicketEmailRecipients {
  to: string[];
  cc?: string[];
  bcc?: string[];
}

export interface TicketEmailContext {
  ticket: Ticket;
  action:
    | 'created'
    | 'updated'
    | 'status_changed'
    | 'assigned'
    | 'commented'
    | 'closed'
    | 'cancelled';
  user: User; // Usuario que realizó la acción
  message?: TicketMessage;
  previousValues?: Partial<Ticket>;
  attachments?: TicketAttachment[];
  recipients: TicketEmailRecipients;
  customMessage?: string;
}

@Injectable()
export class TicketNotificationService implements OnModuleInit {
  /**
   * Notificación de cancelación de ticket
   */
  async notifyTicketCancelled(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(
        `Sending cancellation notification for ticket #${context.ticket.ticketNumber}`,
      );

      const subject = `❌ Ticket Cancelado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;
      // Reuse the ticket-status-changed template for cancellation (action = 'cancelled')
      const emailContext = this.getTicketEmailContext({
        ...context,
        action: 'status_changed', 
        previousValues: context.previousValues || { status: context.ticket.status },
        customMessage: context.customMessage,
      });

      const toList = Array.isArray(context.recipients.to) ? context.recipients.to : [];
      const ccList = Array.isArray(context.recipients.cc) ? context.recipients.cc : [];

      await this.sendSingleEmail(subject, 'ticket-cancelled', {
        ...emailContext,
        ticket: emailContext.ticket,
        action: 'cancelled',
        previousValues: context.previousValues || { status: context.ticket.status },
        customMessage: context.customMessage,
      }, { to: toList, cc: ccList });

      this.logger.log(`Cancellation notifications sent successfully for #${context.ticket.ticketNumber}`);
    } catch (error) {
      this.logger.error(`Error sending cancellation notification: ${error.message}`);
      console.log(`Error sending cancellation notification: ${error.message}`); 
      throw error;
    }
  }
  private readonly logger = new Logger(TicketNotificationService.name);
  // in-memory cache for logo data URI to avoid repeated disk I/O
  private logoDataCache?: string | undefined;
  private logoDataLoaded = false;

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtener la URL del ticket en el sistema
   */
  private getTicketUrl(ticketId: number): string {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl}/apps/ticket/details/${ticketId}`;
  }

  /**
   * Obtener color según la prioridad del ticket
   */
  private getPriorityColor(priority: string): string {
    const colors = {
      LOW: '#28a745',
      MEDIUM: '#ffc107',
      HIGH: '#fd7e14',
      URGENT: '#dc3545',
      CRITICAL: '#6f42c1',
    };
    return colors[priority] || '#6c757d';
  }

  /**
   * Obtener color según el estado del ticket
   */
  private getStatusColor(status: TicketStatus): string {
    const colors = {
      OPEN: '#007bff',
      IN_PROGRESS: '#17a2b8',
      FOLLOW_UP: '#ffc107',
      COMPLETED: '#28a745',
      CLOSED: '#343a40',
      NON_CONFORMITY: '#6f42c1',
      CANCELLED: '#dc3545',
    };
    return colors[status] || '#6c757d';
  }

  /**
   * Obtener el contexto base para emails de tickets
   */
  private getTicketEmailContext(context: TicketEmailContext) {
    // helper to escape HTML so user-provided messages don't render as HTML in emails
    const escapeHtml = (input: any) => {
      if (input === null || input === undefined) return '';
      const s = String(input);
      return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // compute response time from stored customFields.workingHours if available
    let responseTimeHours: number | null = null;
    try {
      const cf = (context.ticket as any).customFields;
      if (cf && typeof cf.workingHours === 'number') responseTimeHours = cf.workingHours;
    } catch (err) {
      // ignore
    }
  return {
      ticket: {
        ...context.ticket,
        url: this.getTicketUrl(context.ticket.id),
        priorityColor: this.getPriorityColor(context.ticket.priority),
        statusColor: this.getStatusColor(context.ticket.status),
        hasAttachments: (context.attachments?.length || 0) > 0,
        attachmentCount: context.attachments?.length || 0,
        formattedCreatedAt: new Date(context.ticket.createdAt).toLocaleString(
          'es-ES',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Mexico_City',
          },
        ),
        formattedDueDate: context.ticket.dueDate
          ? new Date(context.ticket.dueDate).toLocaleString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Mexico_City',
            })
          : null,
      },
      user: context.user,
      action: context.action,
      // normalize message content so templates can use either 'message' or 'content'
      message: context.message,
      // ensure content used in templates is escaped to avoid HTML rendering
      content: escapeHtml(
        context.message?.content || context.customMessage || context.ticket.description || '',
      ),
      // rawCustomMessage: solo para plantillas que permiten HTML seguro (ej. cierre)
      rawCustomMessage: context.customMessage || '',
      previousValues: context.previousValues,
      attachments: context.attachments || [],
      customMessage: context.customMessage,
      systemInfo: {
        frontendUrl:
          this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
        // attempt to embed a base64 logo if available; fall back to configured URL
        logoUrl:
          this.configService.get('CHARLOTTE_LOGO_URL') ||
          'https://via.placeholder.com/200x80/007bff/ffffff?text=CHARLOTTE',
        // use cached logoData when available to reduce I/O
        logoData: this.logoDataLoaded
          ? this.logoDataCache
          : this.loadLogoAsDataUri(),
        year: new Date().getFullYear(),
        supportEmail:
          this.configService.get('SUPPORT_EMAIL') || 'soporte@charlotte.com',
      },
      // add response time info if present
      responseTimeHours,
      responseTimeFormatted: responseTimeHours !== null ? `${parseFloat(responseTimeHours.toFixed(2))} horas` : null,
      // also include a sanitized version of the message for templates that render message fields
      sanitizedMessage: context.message
        ? { ...context.message, content: escapeHtml(context.message.content || '') }
        : null,
    };
  }

  /**
   * Try to read a logo file from configured path and return a data URI string.
   */
  private loadLogoAsDataUri(): string | undefined {
    // If we've already attempted to load the logo, return cached result (could be undefined)
    if (this.logoDataLoaded) return this.logoDataCache;
    try {
      const fs = require('fs');
      const path = require('path');
      
      const configured =
        this.configService.get<string>('CHARLOTTE_LOGO_PATH') ||
        this.configService.get<string>('CHARLOTTE_LOGO_URL');
      let logoPath: string | undefined;

      // Try several strategies to resolve a local file to embed as data URI:
      // 1) If configured is an absolute or relative path, use it
      // 2) If configured is an URL pointing to /images/... try to map to process.cwd()+pathname
      // 3) Fallback to public/images/logos with basename of configured
      try {
        if (configured) {
          if (path.isAbsolute(configured)) {
            logoPath = configured;
          } else if (configured.startsWith('http')) {
            try {
              const maybeUrl = new URL(configured);
              if (
                maybeUrl.pathname &&
                maybeUrl.pathname.indexOf('/images/') === 0
              ) {
                logoPath = path.join(process.cwd(), maybeUrl.pathname);
              }
            } catch (err) {
              // ignore parse errors
            }
            if (!logoPath) {
              // try matching by basename under public/images/logos
              const fileName = path.basename(decodeURIComponent(configured));
              logoPath = path.join(
                process.cwd(),
                'public',
                'images',
                'logos',
                fileName,
              );
            }
          } else {
            logoPath = path.join(process.cwd(), configured);
          }
        } else {
          // default location
          logoPath = path.join(
            process.cwd(),
            'public',
            'images',
            'logos',
            'Logo azul CCI INTL.png',
          );
        }
      } catch (err) {
        this.logger.debug(
          'Error resolving configured logo path:',
          (err as Error).message || err,
        );
      }

      if (!logoPath || !fs.existsSync(logoPath)) {
        // not found; mark loaded and keep cache undefined so templates can fallback to logoUrl
        this.logoDataLoaded = true;
        this.logoDataCache = undefined;
        return undefined;
      }

      const buffer = fs.readFileSync(logoPath);
      const ext = path.extname(logoPath).toLowerCase().replace('.', '');
      const mime =
        ext === 'svg'
          ? 'image/svg+xml'
          : ext === 'png'
            ? 'image/png'
            : ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : 'application/octet-stream';
      const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
      // cache and mark as loaded
      this.logoDataCache = dataUri;
      this.logoDataLoaded = true;
      return dataUri;
    } catch (err) {
      this.logoDataLoaded = true;
      this.logoDataCache = undefined;
      this.logger.debug(
        'Could not load logo as data URI:',
        err?.message || err,
      );
      return undefined;
    }
  }

  async onModuleInit(): Promise<void> {
    // Preload logo into memory at startup to avoid first-request penalty
    try {
      const v = this.loadLogoAsDataUri();
      console.debug(`Logo preloaded: ${v ? 'yes' : 'no'}`);
    } catch (err) {
      console.debug('Error preloading logo:', (err as Error).message || err);
    }
  }

  /**
   * Helper: send a single email with primary 'to' and cc array (one sendMail call)
   */
  private async sendSingleEmail(
    subject: string,
    template: string,
    emailContext: any,
    recipients: { to?: string[]; cc?: string[] },
  ) {
    const isValidEmail = (e: string) =>
      typeof e === 'string' && /.+@.+\..+/.test(e.trim());
    const toList = (recipients.to || [])
      .map((r) => (r || '').toString().trim())
      .filter(isValidEmail);
    const ccList = (recipients.cc || [])
      .map((r) => (r || '').toString().trim())
      .filter(isValidEmail);
    if (toList.length === 0 && ccList.length === 0) return;

    // Decide primary: prefer assigned, then creator, then first toList
    let primary: string | undefined;
    if (
      emailContext.ticket?.assignee?.email &&
      toList.includes(emailContext.ticket.assignee.email)
    )
      primary = emailContext.ticket.assignee.email;
    if (
      !primary &&
      emailContext.ticket?.creator?.email &&
      toList.includes(emailContext.ticket.creator.email)
    )
      primary = emailContext.ticket.creator.email;
    if (!primary) primary = toList[0] || ccList[0];

    // Build cc as others excluding primary
    const others = Array.from(
      new Set(
        [...(toList || []), ...(ccList || [])].filter((e) => e !== primary),
      ),
    );

    // Send single email — log payload before and after
    const mailPayload = {
      ...emailContext,
      recipient: primary,
      isMainRecipient: true,
      cc: others.length ? others : undefined,
    };
    try {
      console.log('About to send email (sendSingleEmail):', {
        to: primary,
        subject,
        template,
        payload: mailPayload,
      });
      await this.emailService.sendEmailWithTemplate(
        primary!,
        subject,
        template,
        mailPayload,
      );
      console.log('Email sent (sendSingleEmail):', {
        to: primary,
        subject,
        template,
      });
    } catch (err) {
      console.error('Error sending email (sendSingleEmail):', {
        to: primary,
        subject,
        template,
        error: (err as Error).message || err,
      });
      throw err;
    }
  }

  /**
   * Notificación de creación de ticket
   */
  async notifyTicketCreated(context: TicketEmailContext): Promise<void> {
    try {
      console.log(`Processing ticket creation for #${context.ticket.ticketNumber}`);

      const subject = `🎫 Nuevo Ticket Creado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;
      const baseEmailContext = this.getTicketEmailContext(context);

      const isValidEmail = (e: string) => typeof e === 'string' && /.+@.+\..+/.test(e.trim());

      // Creator and assignee emails (assignee may be present as object)
      const creatorEmail = context.ticket.creator?.email;
      const assigneeEmail = context.ticket.assignee?.email;

      // Build participants from ticket.participants but exclude creator and assignee
      const rawParticipants = Array.isArray(context.ticket.participants) ? context.ticket.participants : [];
      const filteredParticipants = rawParticipants.filter((p: any) => {
        const email = p && (p.email || p.userEmail || p.emailAddress);
        if (!email) return false;
        if (creatorEmail && email === creatorEmail) return false;
        if (assigneeEmail && email === assigneeEmail) return false;
        return true;
      });
      const participantsEmails = Array.from(new Set(filteredParticipants.map((p: any) => (p && (p.email || p.userEmail || p.emailAddress) || '').toString().trim()).filter(isValidEmail)));

      // Email context for sending (do not mutate original context)
      const emailContext = {
        ...baseEmailContext,
        ticket: {
          ...baseEmailContext.ticket,
          participants: filteredParticipants,
        },
      };

      // Send ticket-created only to creator, CC participants
      if (creatorEmail && isValidEmail(creatorEmail)) {
        const payload = { ...emailContext, recipient: creatorEmail, isMainRecipient: true, cc: participantsEmails.length ? participantsEmails : undefined };
        try {
          console.log('About to send ticket-created to creator:', { to: creatorEmail, subject, payload });
          await this.emailService.sendEmailWithTemplate(creatorEmail, subject, 'ticket-created', payload);
          console.log('Sent ticket-created to creator:', { to: creatorEmail });
        } catch (err) {
          console.error('Error sending ticket-created to creator:', { to: creatorEmail, subject, error: (err as Error).message || err });
          throw err;
        }
      } else {
        console.warn('No valid creator email for ticket-created notification:', context.ticket.ticketNumber);
      }

      // Send ticket-assigned only to assignee (no CC) when assignee present and not same as creator
      if (assigneeEmail && isValidEmail(assigneeEmail) && assigneeEmail !== creatorEmail) {
        const assignPayload = { ...emailContext, recipient: assigneeEmail, isMainRecipient: true };
        try {
          console.log('About to send ticket-assigned to assignee:', { to: assigneeEmail, payload: assignPayload });
          await this.emailService.sendEmailWithTemplate(assigneeEmail, `👤 Ticket Asignado: ${context.ticket.title} (#${context.ticket.ticketNumber})`, 'ticket-assigned', assignPayload);
          console.log('Sent ticket-assigned to assignee:', { to: assigneeEmail });
        } catch (err) {
          console.error('Error sending ticket-assigned to assignee:', { to: assigneeEmail, error: (err as Error).message || err });
          // fail silently for assignment email (do not block creation)
        }
      }

      console.log(`Ticket creation processing completed for #${context.ticket.ticketNumber}`);
    } catch (error) {
      console.error(`Error processing ticket creation notification: ${(error as Error).message || error}`);
      throw error;
    }
  }
 
  /**
   * Notificación de actualización de ticket
   */
  async notifyTicketUpdated(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(
        `Sending ticket update notification for ticket #${context.ticket.ticketNumber}`,
      );

      const subject = `📝 Ticket Actualizado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;

      const emailContext = this.getTicketEmailContext(context);

      const toList = Array.isArray(context.recipients.to)
        ? context.recipients.to
        : [];
      const ccList = Array.isArray(context.recipients.cc)
        ? context.recipients.cc
        : [];
      const exclude = [
        context.ticket.creator?.email,
        context.ticket.assignee?.email,
      ].filter(Boolean) as string[];
      const toFiltered2 = toList
        .map((r) => (r || '').toString().trim())
        .filter((r) => r && !exclude.includes(r));
      const ccFiltered2 = ccList
        .map((r) => (r || '').toString().trim())
        .filter((r) => r && !exclude.includes(r));
      await this.sendSingleEmail(subject, 'ticket-updated', emailContext, {
        to: toFiltered2.length
          ? toFiltered2
          : ([
              context.ticket.creator?.email || context.ticket.assignee?.email,
            ].filter(Boolean) as string[]),
        cc: ccFiltered2,
      });

      this.logger.log(
        `Ticket update notifications sent successfully for #${context.ticket.ticketNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending ticket update notification: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Notificación de cambio de estado de ticket
   */
  async notifyTicketStatusChanged(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(
        `Sending status change notification for ticket #${context.ticket.ticketNumber}`,
      );

      const oldStatus = context.previousValues?.status;
      const newStatus = context.ticket.status;

      let statusEmoji = '🔄';
      switch (newStatus) {
        case TicketStatus.IN_PROGRESS:
          statusEmoji = '⚡';
          break;
        case TicketStatus.FOLLOW_UP:
          statusEmoji = '🔁';
          break;
        case TicketStatus.COMPLETED:
          statusEmoji = '✅';
          break;
        case TicketStatus.CLOSED:
          statusEmoji = '🔒';
          break;
        case TicketStatus.CANCELLED:
          statusEmoji = '❌';
          break;
        case TicketStatus.NON_CONFORMITY:
          statusEmoji = '⚠️';
          break;
      }

      const subject = `${statusEmoji} Estado Cambiado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;

      const emailContext = {
        ...this.getTicketEmailContext(context),
        statusChange: {
          oldStatus,
          newStatus,
          oldStatusColor: this.getStatusColor(oldStatus as TicketStatus),
          newStatusColor: this.getStatusColor(newStatus),
        },
      };

      const toList3 = Array.isArray(context.recipients.to)
        ? context.recipients.to
        : [];
      const ccList3 = Array.isArray(context.recipients.cc)
        ? context.recipients.cc
        : [];
      const exclude3 = [
        context.ticket.creator?.email,
        context.ticket.assignee?.email,
      ].filter(Boolean) as string[];
      const toFiltered3 = toList3
        .map((r) => (r || '').toString().trim())
        .filter((r) => r && !exclude3.includes(r));
      const ccFiltered3 = ccList3
        .map((r) => (r || '').toString().trim())
        .filter((r) => r && !exclude3.includes(r));
      await this.sendSingleEmail(
        subject,
        'ticket-status-changed',
        emailContext,
        {
          to: toFiltered3.length
            ? toFiltered3
            : ([
                context.ticket.assignee?.email || context.ticket.creator?.email,
              ].filter(Boolean) as string[]),
          cc: ccFiltered3,
        },
      );

      this.logger.log(
        `Status change notifications sent successfully for #${context.ticket.ticketNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending status change notification: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Notificación de asignación de ticket
   */
  async notifyTicketAssigned(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(
        `Sending assignment notification for ticket #${context.ticket.ticketNumber}`,
      );

      const subject = `👤 Ticket Asignado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;

      const emailContext = this.getTicketEmailContext(context);

      const toList4 = Array.isArray(context.recipients.to)
        ? context.recipients.to
        : [];
      const ccList4 = Array.isArray(context.recipients.cc)
        ? context.recipients.cc
        : [];
      const exclude4 = [
        context.ticket.creator?.email,
        context.ticket.assignee?.email,
      ].filter(Boolean) as string[];
      const toFiltered4 = toList4
        .map((r) => (r || '').toString().trim())
        .filter((r) => r && !exclude4.includes(r));
      const ccFiltered4 = ccList4
        .map((r) => (r || '').toString().trim())
        .filter((r) => r && !exclude4.includes(r));
      await this.sendSingleEmail(subject, 'ticket-assigned', emailContext, {
        to: toFiltered4.length
          ? toFiltered4
          : ([
              context.ticket.assignee?.email || context.ticket.creator?.email,
            ].filter(Boolean) as string[]),
        cc: ccFiltered4,
      });

      this.logger.log(
        `Assignment notifications sent successfully for #${context.ticket.ticketNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending assignment notification: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Notificación de nuevo comentario en ticket
   */
  async notifyTicketCommented(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(
        `Sending comment notification for ticket #${context.ticket.ticketNumber}`,
      );

      const subject = `💬 Nuevo Comentario: ${context.ticket.title} (#${context.ticket.ticketNumber})`;

      const emailContext = this.getTicketEmailContext(context);

      const toList5 = Array.isArray(context.recipients.to)
        ? context.recipients.to
        : [];
      const ccList5 = Array.isArray(context.recipients.cc)
        ? context.recipients.cc
        : [];
      const exclude5 = [
        context.ticket.creator?.email,
        context.ticket.assignee?.email,
      ].filter(Boolean) as string[];
      const toFiltered5 = toList5
        .map((r) => (r || '').toString().trim())
        .filter((r) => r && !exclude5.includes(r));
      const ccFiltered5 = ccList5
        .map((r) => (r || '').toString().trim())
        .filter((r) => r && !exclude5.includes(r));
      await this.sendSingleEmail(subject, 'ticket-commented', emailContext, {
        to: toFiltered5.length
          ? toFiltered5
          : ([
              context.ticket.assignee?.email || context.ticket.creator?.email,
            ].filter(Boolean) as string[]),
        cc: ccFiltered5,
      });

      this.logger.log(
        `Comment notifications sent successfully for #${context.ticket.ticketNumber}`,
      );
    } catch (error) {
      this.logger.error(`Error sending comment notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notificación de cierre de ticket
   */
  async notifyTicketClosed(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(
        `Sending closure notification for ticket #${context.ticket.ticketNumber}`,
      );

      const subject = `🔒 Ticket Cerrado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;

      const emailContext = this.getTicketEmailContext(context);
      const toList = Array.isArray(context.recipients.to)
        ? context.recipients.to
        : [];
      const ccList = Array.isArray(context.recipients.cc)
        ? context.recipients.cc
        : [];
      const exclude = [
        context.ticket.creator?.email,
        context.ticket.assignee?.email,
      ].filter(Boolean) as string[];
      const toFiltered = toList
        .map((r) => (r || '').toString().trim());
      const ccFiltered = ccList
        .map((r) => (r || '').toString().trim())
        .filter((r) => r && !exclude.includes(r));
      console.log('Closure email to:', toFiltered);
      console.log('Closure email cc:', ccFiltered); 
      await this.sendSingleEmail(subject, 'ticket-closed', emailContext, {
        to: toFiltered.length
          ? toFiltered
          : ([
              context.ticket.assignee?.email || context.ticket.creator?.email,
            ].filter(Boolean) as string[]),
        cc: ccFiltered,
      });

      this.logger.log(
        `Closure notifications sent successfully for #${context.ticket.ticketNumber}`,
      );
    } catch (error) {
      this.logger.error(`Error sending closure notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Método universal para enviar cualquier tipo de notificación
   */
  async sendTicketNotification(context: TicketEmailContext): Promise<void> {
    switch (context.action) {
      case 'created':
        await this.notifyTicketCreated(context);
        break;
      case 'updated':
        await this.notifyTicketUpdated(context);
        break;
      case 'status_changed':
        await this.notifyTicketStatusChanged(context);
        break;
      case 'assigned':
        await this.notifyTicketAssigned(context);
        break;
      case 'commented':
        await this.notifyTicketCommented(context);
        break;
      case 'closed':
        await this.notifyTicketClosed(context);
        break;
      default:
        this.logger.warn(`Unknown ticket action: ${context.action}`);
    }
  }
}
