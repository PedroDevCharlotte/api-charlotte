import { Injectable, Logger } from '@nestjs/common';
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
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented' | 'closed';
  user: User; // Usuario que realizó la acción
  message?: TicketMessage;
  previousValues?: Partial<Ticket>;
  attachments?: TicketAttachment[];
  recipients: TicketEmailRecipients;
  customMessage?: string;
}

@Injectable()
export class TicketNotificationService {
  private readonly logger = new Logger(TicketNotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtener la URL del ticket en el sistema
   */
  private getTicketUrl(ticketId: number): string {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl}/tickets/${ticketId}`;
  }

  /**
   * Obtener color según la prioridad del ticket
   */
  private getPriorityColor(priority: string): string {
    const colors = {
      'LOW': '#28a745',
      'MEDIUM': '#ffc107', 
      'HIGH': '#fd7e14',
      'URGENT': '#dc3545',
      'CRITICAL': '#6f42c1'
    };
    return colors[priority] || '#6c757d';
  }

  /**
   * Obtener color según el estado del ticket
   */
  private getStatusColor(status: TicketStatus): string {
    const colors = {
  'OPEN': '#007bff',
  'IN_PROGRESS': '#17a2b8',
  'FOLLOW_UP': '#ffc107',
  'COMPLETED': '#28a745',
  'CLOSED': '#343a40',
  'NON_CONFORMITY': '#6f42c1',
  'CANCELLED': '#dc3545'
    };
    return colors[status] || '#6c757d';
  }

  /**
   * Obtener el contexto base para emails de tickets
   */
  private getTicketEmailContext(context: TicketEmailContext) {
    return {
      ticket: {
        ...context.ticket,
        url: this.getTicketUrl(context.ticket.id),
        priorityColor: this.getPriorityColor(context.ticket.priority),
        statusColor: this.getStatusColor(context.ticket.status),
        hasAttachments: (context.attachments?.length || 0) > 0,
        attachmentCount: context.attachments?.length || 0,
        formattedCreatedAt: new Date(context.ticket.createdAt).toLocaleString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Mexico_City'
        }),
        formattedDueDate: context.ticket.dueDate ? new Date(context.ticket.dueDate).toLocaleString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Mexico_City'
        }) : null
      },
      user: context.user,
      action: context.action,
      message: context.message,
      previousValues: context.previousValues,
      attachments: context.attachments || [],
      customMessage: context.customMessage,
      systemInfo: {
        frontendUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
        logoUrl: this.configService.get('CHARLOTTE_LOGO_URL') || 'https://via.placeholder.com/200x80/007bff/ffffff?text=CHARLOTTE',
        year: new Date().getFullYear(),
        supportEmail: this.configService.get('SUPPORT_EMAIL') || 'soporte@charlotte.com'
      }
    };
  }

  /**
   * Notificación de creación de ticket
   */
  async notifyTicketCreated(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(`Sending ticket creation notification for ticket #${context.ticket.ticketNumber}`);

      const subject = `🎫 Nuevo Ticket Creado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;
      
      const emailContext = this.getTicketEmailContext(context);

      // Validar y filtrar destinatarios
      const isValidEmail = (e: string) => typeof e === 'string' && /.+@.+\..+/.test(e.trim());
      const toRecipients = Array.isArray(context.recipients?.to) ? context.recipients.to : [];
      const ccRecipients = Array.isArray(context.recipients?.cc) ? context.recipients.cc : [];

      const validTo = toRecipients.map(r => (r || '').toString().trim()).filter(isValidEmail);
      const invalidTo = toRecipients.filter(r => !isValidEmail((r || '').toString()));
      if (invalidTo.length) {
        this.logger.warn(`Invalid 'to' recipients filtered out: ${JSON.stringify(invalidTo)}`);
      }

      // Enviar a destinatarios principales
      for (const recipient of validTo) {
        await this.emailService.sendEmailWithTemplate(
          recipient,
          subject,
          'ticket-created',
          {
            ...emailContext,
            recipient: recipient,
            isMainRecipient: true
          }
        );
      }

      // Enviar copias si existen
      if (ccRecipients.length) {
        const validCc = ccRecipients.map(r => (r || '').toString().trim()).filter(isValidEmail);
        const invalidCc = ccRecipients.filter(r => !isValidEmail((r || '').toString()));
        if (invalidCc.length) {
          this.logger.warn(`Invalid 'cc' recipients filtered out: ${JSON.stringify(invalidCc)}`);
        }
        for (const ccRecipient of validCc) {
          await this.emailService.sendEmailWithTemplate(
            ccRecipient,
            `CC: ${subject}`,
            'ticket-created',
            {
              ...emailContext,
              recipient: ccRecipient,
              isMainRecipient: false,
              isCopy: true
            }
          );
        }
      }

      this.logger.log(`Ticket creation notifications sent successfully for #${context.ticket.ticketNumber}`);
    } catch (error) {
      this.logger.error(`Error sending ticket creation notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notificación de actualización de ticket
   */
  async notifyTicketUpdated(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(`Sending ticket update notification for ticket #${context.ticket.ticketNumber}`);

      const subject = `📝 Ticket Actualizado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;
      
      const emailContext = this.getTicketEmailContext(context);

      // Enviar a destinatarios principales
      for (const recipient of context.recipients.to) {
        await this.emailService.sendEmailWithTemplate(
          recipient,
          subject,
          'ticket-updated',
          {
            ...emailContext,
            recipient: recipient,
            isMainRecipient: true
          }
        );
      }

      // Enviar copias si existen
      if (context.recipients.cc?.length) {
        for (const ccRecipient of context.recipients.cc) {
          await this.emailService.sendEmailWithTemplate(
            ccRecipient,
            `CC: ${subject}`,
            'ticket-updated',
            {
              ...emailContext,
              recipient: ccRecipient,
              isMainRecipient: false,
              isCopy: true
            }
          );
        }
      }

      this.logger.log(`Ticket update notifications sent successfully for #${context.ticket.ticketNumber}`);
    } catch (error) {
      this.logger.error(`Error sending ticket update notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notificación de cambio de estado de ticket
   */
  async notifyTicketStatusChanged(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(`Sending status change notification for ticket #${context.ticket.ticketNumber}`);

      const oldStatus = context.previousValues?.status;
      const newStatus = context.ticket.status;
      
      let statusEmoji = '🔄';
      switch (newStatus) {
        case TicketStatus.IN_PROGRESS: statusEmoji = '⚡'; break;
        case TicketStatus.FOLLOW_UP: statusEmoji = '🔁'; break;
        case TicketStatus.COMPLETED: statusEmoji = '✅'; break;
        case TicketStatus.CLOSED: statusEmoji = '🔒'; break;
        case TicketStatus.CANCELLED: statusEmoji = '❌'; break;
        case TicketStatus.NON_CONFORMITY: statusEmoji = '⚠️'; break;
      }

      const subject = `${statusEmoji} Estado Cambiado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;
      
      const emailContext = {
        ...this.getTicketEmailContext(context),
        statusChange: {
          oldStatus,
          newStatus,
          oldStatusColor: this.getStatusColor(oldStatus as TicketStatus),
          newStatusColor: this.getStatusColor(newStatus)
        }
      };

      // Enviar a destinatarios principales
      for (const recipient of context.recipients.to) {
        await this.emailService.sendEmailWithTemplate(
          recipient,
          subject,
          'ticket-status-changed',
          {
            ...emailContext,
            recipient: recipient,
            isMainRecipient: true
          }
        );
      }

      // Enviar copias si existen
      if (context.recipients.cc?.length) {
        for (const ccRecipient of context.recipients.cc) {
          await this.emailService.sendEmailWithTemplate(
            ccRecipient,
            `CC: ${subject}`,
            'ticket-status-changed',
            {
              ...emailContext,
              recipient: ccRecipient,
              isMainRecipient: false,
              isCopy: true
            }
          );
        }
      }

      this.logger.log(`Status change notifications sent successfully for #${context.ticket.ticketNumber}`);
    } catch (error) {
      this.logger.error(`Error sending status change notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notificación de asignación de ticket
   */
  async notifyTicketAssigned(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(`Sending assignment notification for ticket #${context.ticket.ticketNumber}`);

      const subject = `👤 Ticket Asignado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;
      
      const emailContext = this.getTicketEmailContext(context);

      // Enviar a destinatarios principales
      for (const recipient of context.recipients.to) {
        await this.emailService.sendEmailWithTemplate(
          recipient,
          subject,
          'ticket-assigned',
          {
            ...emailContext,
            recipient: recipient,
            isMainRecipient: true
          }
        );
      }

      // Enviar copias si existen
      if (context.recipients.cc?.length) {
        for (const ccRecipient of context.recipients.cc) {
          await this.emailService.sendEmailWithTemplate(
            ccRecipient,
            `CC: ${subject}`,
            'ticket-assigned',
            {
              ...emailContext,
              recipient: ccRecipient,
              isMainRecipient: false,
              isCopy: true
            }
          );
        }
      }

      this.logger.log(`Assignment notifications sent successfully for #${context.ticket.ticketNumber}`);
    } catch (error) {
      this.logger.error(`Error sending assignment notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Notificación de nuevo comentario en ticket
   */
  async notifyTicketCommented(context: TicketEmailContext): Promise<void> {
    try {
      this.logger.log(`Sending comment notification for ticket #${context.ticket.ticketNumber}`);

      const subject = `💬 Nuevo Comentario: ${context.ticket.title} (#${context.ticket.ticketNumber})`;
      
      const emailContext = this.getTicketEmailContext(context);

      // Enviar a destinatarios principales
      for (const recipient of context.recipients.to) {
        await this.emailService.sendEmailWithTemplate(
          recipient,
          subject,
          'ticket-commented',
          {
            ...emailContext,
            recipient: recipient,
            isMainRecipient: true
          }
        );
      }

      // Enviar copias si existen
      if (context.recipients.cc?.length) {
        for (const ccRecipient of context.recipients.cc) {
          await this.emailService.sendEmailWithTemplate(
            ccRecipient,
            `CC: ${subject}`,
            'ticket-commented',
            {
              ...emailContext,
              recipient: ccRecipient,
              isMainRecipient: false,
              isCopy: true
            }
          );
        }
      }

      this.logger.log(`Comment notifications sent successfully for #${context.ticket.ticketNumber}`);
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
      this.logger.log(`Sending closure notification for ticket #${context.ticket.ticketNumber}`);

      const subject = `🔒 Ticket Cerrado: ${context.ticket.title} (#${context.ticket.ticketNumber})`;
      
      const emailContext = this.getTicketEmailContext(context);

      // Enviar a destinatarios principales
      for (const recipient of context.recipients.to) {
        await this.emailService.sendEmailWithTemplate(
          recipient,
          subject,
          'ticket-closed',
          {
            ...emailContext,
            recipient: recipient,
            isMainRecipient: true
          }
        );
      }

      // Enviar copias si existen
      if (context.recipients.cc?.length) {
        for (const ccRecipient of context.recipients.cc) {
          await this.emailService.sendEmailWithTemplate(
            ccRecipient,
            `CC: ${subject}`,
            'ticket-closed',
            {
              ...emailContext,
              recipient: ccRecipient,
              isMainRecipient: false,
              isCopy: true
            }
          );
        }
      }

      this.logger.log(`Closure notifications sent successfully for #${context.ticket.ticketNumber}`);
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
