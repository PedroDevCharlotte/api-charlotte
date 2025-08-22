import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketMessage, MessageType } from './Entity/ticket-message.entity';
import { TicketMessageRead } from './Entity/ticket-message-read.entity';
import { TicketParticipant } from './Entity/ticket-participant.entity';
import { CreateTicketMessageDto, UpdateTicketMessageDto } from './Dto/ticket-message.dto';
import { TicketStatus } from './Entity/ticket.entity';
import { UpdateTicketDto } from './Dto/ticket.dto';
import { TicketsService } from './tickets.service';

export interface MessageFilters {
  ticketId: number;
  type?: MessageType;
  isInternal?: boolean;
  senderId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class TicketMessagesService {
  constructor(
    @InjectRepository(TicketMessage)
    private messageRepository: Repository<TicketMessage>,
    @InjectRepository(TicketMessageRead)
    private messageReadRepository: Repository<TicketMessageRead>,
    @InjectRepository(TicketParticipant)
    private participantRepository: Repository<TicketParticipant>,
    private ticketsService: TicketsService,
  ) {}

  /**
   * Crear un nuevo mensaje en un ticket
   */
  async create(createMessageDto: CreateTicketMessageDto, currentUserId: number): Promise<TicketMessage> {
    // Verificar acceso al ticket
    const ticket = await this.ticketsService.findOne(createMessageDto.ticketId, currentUserId);
    console.log(' ------------------- Crear mensaje:  -----------------------------------', createMessageDto);
    
    // Verificar que el usuario puede escribir mensajes
    await this.checkWritePermissions(createMessageDto.ticketId, currentUserId);

    // Si es respuesta, verificar que el mensaje padre existe
    if (createMessageDto.replyToId) {
      const parentMessage = await this.messageRepository.findOne({
        where: { id: createMessageDto.replyToId, ticketId: createMessageDto.ticketId }
      });
      
      if (!parentMessage) {
        throw new BadRequestException('Mensaje padre no encontrado en este ticket');
      }
    }
    
    // Crear el mensaje
    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId: currentUserId,
      // Los mensajes internos solo los pueden ver los participantes internos
      isInternal: createMessageDto.isInternal || false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Marcar como leído por el remitente
    await this.markAsRead(savedMessage.id, currentUserId);

    // Notificar por correo a destinatarios relevantes (participantes, assigned, creator)
    try {
      const recipients = await this.ticketsService.buildEmailRecipients(createMessageDto.ticketId, currentUserId);
      const actor = await this.ticketsService['userRepository'].findOne({ where: { id: currentUserId } });
      const ticketForEmail = await this.ticketsService.findOne(createMessageDto.ticketId, currentUserId);
      const notificationService = this.ticketsService['ticketNotificationService'];
      if (notificationService?.notifyTicketCommented) {
        try {
          const attachmentRepo = this.ticketsService['attachmentRepository'];
          let messageAttachments: any[] = [];
          if (attachmentRepo) {
            messageAttachments = await attachmentRepo.find({ where: { messageId: savedMessage.id } });
          }
          notificationService.notifyTicketCommented({
            ticket: ticketForEmail,
            action: 'commented',
            user: actor || { id: currentUserId, firstName: '', lastName: '', email: '' } as any,
            message: savedMessage,
            attachments: messageAttachments,
            recipients
          }).catch(err => console.error('Error enviando notificación por comentario:', err));
        } catch (err) {
          console.error('Error obteniendo attachments para notificación:', err);
          notificationService.notifyTicketCommented({
            ticket: ticketForEmail,
            action: 'commented',
            user: actor || { id: currentUserId, firstName: '', lastName: '', email: '' } as any,
            message: savedMessage,
            attachments: [],
            recipients
          }).catch(err2 => console.error('Error enviando notificación por comentario (fallback):', err2));
        }
      }
    } catch (err) {
      console.error('Error preparando notificación por comentario:', err);
    }

    // Si el remitente es el asignado, marcar FOLLOW_UP; si es el creador, marcar IN_PROGRESS.
    try {
      if (ticket) {
        const assignedId = ticket.assignedTo && (typeof ticket.assignedTo === 'object' ? ticket.assignedTo.id : ticket.assignedTo);
        const creatorId = ticket.createdBy && (typeof ticket.createdBy === 'object' ? ticket.createdBy.id : ticket.createdBy);

        // Si el remitente es el asignado -> FOLLOW_UP (prioritario)
        if (assignedId && savedMessage.senderId === assignedId && ticket.status !== TicketStatus.FOLLOW_UP) {
          await this.ticketsService.update(ticket.id, { status: TicketStatus.FOLLOW_UP } as UpdateTicketDto, currentUserId);
        // Si el remitente es el creador -> IN_PROGRESS
        } else if (creatorId && savedMessage.senderId === creatorId && ticket.status !== TicketStatus.IN_PROGRESS) {
          await this.ticketsService.update(ticket.id, { status: TicketStatus.IN_PROGRESS } as UpdateTicketDto, currentUserId);
        }
      }
    } catch (err) {
      // No detener el flujo si la actualización de estado falla; loguear para diagnóstico
      console.error('Error al intentar cambiar status tras crear mensaje:', err);
    }

    return this.findOne(savedMessage.id, currentUserId);
  }

  /**
   * Crear mensaje con archivos adjuntos, actualizar participantes y notificar
   */
  async createWithAttachments(
    createMessageDto: CreateTicketMessageDto,
    currentUserId: number,
    files: any[]
  ): Promise<TicketMessage> {
    // 1. Verificar acceso y permisos
    const ticket = await this.ticketsService.findOne(createMessageDto.ticketId, currentUserId);
    await this.checkWritePermissions(createMessageDto.ticketId, currentUserId);

    // 2. Si el usuario no es participante, agregarlo como colaborador
    let participant = await this.participantRepository.findOne({ where: { ticketId: createMessageDto.ticketId, userId: currentUserId } });
    if (!participant) {
      const { ParticipantRole } = require('./Entity/ticket-participant.entity');
      participant = this.participantRepository.create({
        ticketId: createMessageDto.ticketId,
        userId: currentUserId,
        role: ParticipantRole.COLLABORATOR,
        canEdit: false,
        canComment: true,
        canClose: false,
        canAssign: false
      });
      await this.participantRepository.save(participant);
    }

    // 3. Crear el mensaje
    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId: currentUserId,
      isInternal: createMessageDto.isInternal || false,
    });
    const savedMessage = await this.messageRepository.save(message);

    // 4. Guardar archivos adjuntos si existen
    if (files && files.length > 0) {
      const fs = require('fs');
      const path = require('path');
      const uploadDir = 'uploads/ticket-messages';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      for (const file of files) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.originalname);
        const fileName = `${timestamp}_${randomStr}${ext}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        // Guardar registro en la base de datos (TicketAttachment)
        const attachmentRepo = this.ticketsService['attachmentRepository'];
        await attachmentRepo.save({
          ticketId: createMessageDto.ticketId,
          messageId: savedMessage.id,
          uploadedById: currentUserId,
          fileName,
          originalFileName: file.originalname,
          filePath,
          mimeType: file.mimetype,
          fileSize: file.size,
          description: file.originalname
        });
      }
    }

    // 5. Marcar como leído por el remitente
    await this.markAsRead(savedMessage.id, currentUserId);

    // Si el remitente es el asignado, marcar FOLLOW_UP; si es el creador, marcar IN_PROGRESS.
    try {
      if (ticket) {
        const assignedId = ticket.assignedTo && (typeof ticket.assignedTo === 'object' ? ticket.assignedTo.id : ticket.assignedTo);
        const creatorId = ticket.createdBy && (typeof ticket.createdBy === 'object' ? ticket.createdBy.id : ticket.createdBy);

        if (assignedId && savedMessage.senderId === assignedId && ticket.status !== TicketStatus.FOLLOW_UP) {
          await this.ticketsService.update(ticket.id, { status: TicketStatus.FOLLOW_UP } as UpdateTicketDto, currentUserId);
        } else if (creatorId && savedMessage.senderId === creatorId && ticket.status !== TicketStatus.IN_PROGRESS) {
          await this.ticketsService.update(ticket.id, { status: TicketStatus.IN_PROGRESS } as UpdateTicketDto, currentUserId);
        }
      }
    } catch (err) {
      console.error('Error al intentar cambiar status tras crear mensaje con adjuntos:', err);
    }

    // 6. Notificar a los destinatarios (usuario, técnico asignado, participantes)

    // Notificar a los destinatarios (usuario, técnico asignado, participantes)
    const notificationService = this.ticketsService['ticketNotificationService'];
    if (notificationService?.notifyTicketCommented) {
      // Buscar usuario que envía el mensaje
      const userRepo = this.ticketsService['userRepository'];
      const user = await userRepo.findOne({ where: { id: currentUserId } });
      if (!user) throw new NotFoundException('Usuario no encontrado para notificación');
      // Construir destinatarios y enviar notificación
      try {
        const recipients = await this.ticketsService.buildEmailRecipients(createMessageDto.ticketId, currentUserId);
        await notificationService.notifyTicketCommented({
          ticket,
          action: 'commented',
          user,
          message: savedMessage,
          attachments: [],
          recipients
        });
      } catch (err) {
        console.error('Error preparando o enviando notificación por comentario con adjuntos:', err);
      }
    }

    return this.findOne(savedMessage.id, currentUserId);
  }

  /**
   * Obtener mensajes de un ticket con filtros
   */
  async findByTicket(filters: MessageFilters, currentUserId: number): Promise<{ messages: TicketMessage[]; total: number }> {
    // Verificar acceso al ticket
    await this.ticketsService.findOne(filters.ticketId, currentUserId);

    // Verificar si el usuario puede ver mensajes internos
    const canViewInternal = await this.canViewInternalMessages(filters.ticketId, currentUserId);

    const queryBuilder = this.messageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.sender', 'replyToSender')
      .leftJoinAndSelect('message.attachments', 'attachments')
      .leftJoinAndSelect('message.reads', 'reads')
      .leftJoinAndSelect('reads.user', 'readUser')
      .where('message.ticketId = :ticketId', { ticketId: filters.ticketId });

    // Filtrar mensajes internos si el usuario no tiene permisos
    if (!canViewInternal) {
      queryBuilder.andWhere('message.isInternal = false');
    }

    // Aplicar filtros adicionales
    if (filters.type) {
      queryBuilder.andWhere('message.type = :type', { type: filters.type });
    }

    if (filters.isInternal !== undefined) {
      queryBuilder.andWhere('message.isInternal = :isInternal', { isInternal: filters.isInternal });
    }

    if (filters.senderId) {
      queryBuilder.andWhere('message.senderId = :senderId', { senderId: filters.senderId });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('message.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('message.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Ordenamiento por fecha de creación
    queryBuilder.orderBy('message.createdAt', 'ASC');

    const [messages, total] = await queryBuilder.getManyAndCount();

    return { messages, total };
  }

  /**
   * Obtener un mensaje específico
   */
  async findOne(id: number, currentUserId: number): Promise<TicketMessage> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: [
        'sender',
        'ticket',
        'replyTo',
        'replyTo.sender',
        'attachments',
        'attachments.uploadedBy',
        'reads',
        'reads.user'
      ],
    });

    if (!message) {
      throw new NotFoundException(`Mensaje con ID ${id} no encontrado`);
    }

    // Verificar acceso al ticket
    await this.ticketsService.findOne(message.ticketId, currentUserId);

    // Verificar si puede ver mensajes internos
    if (message.isInternal) {
      const canView = await this.canViewInternalMessages(message.ticketId, currentUserId);
      if (!canView) {
        throw new ForbiddenException('No tienes permisos para ver este mensaje');
      }
    }

    return message;
  }

  /**
   * Actualizar un mensaje
   */
  async update(id: number, updateMessageDto: UpdateTicketMessageDto, currentUserId: number): Promise<TicketMessage> {
    const message = await this.findOne(id, currentUserId);

    // Solo el remitente puede editar sus mensajes
    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('Solo puedes editar tus propios mensajes');
    }

    // No se pueden editar mensajes del sistema
    if (message.type === MessageType.SYSTEM) {
      throw new BadRequestException('No se pueden editar mensajes del sistema');
    }

    // Actualizar campos permitidos
    Object.assign(message, {
      content: updateMessageDto.content || message.content,
      isInternal: updateMessageDto.isInternal !== undefined ? updateMessageDto.isInternal : message.isInternal,
      metadata: updateMessageDto.metadata ? { ...message.metadata, ...updateMessageDto.metadata } : message.metadata,
      editedAt: new Date(),
    });

    await this.messageRepository.save(message);

    return this.findOne(id, currentUserId);
  }

  /**
   * Marcar mensaje como leído
   */
  async markAsRead(messageId: number, currentUserId: number): Promise<void> {
    const message = await this.findOne(messageId, currentUserId);

    // Verificar si ya está marcado como leído
    const existingRead = await this.messageReadRepository.findOne({
      where: { messageId, userId: currentUserId }
    });

    if (!existingRead) {
      const messageRead = this.messageReadRepository.create({
        messageId,
        userId: currentUserId,
      });

      await this.messageReadRepository.save(messageRead);
    }
  }

  /**
   * Marcar múltiples mensajes como leídos
   */
  async markMultipleAsRead(messageIds: number[], currentUserId: number): Promise<void> {
    for (const messageId of messageIds) {
      await this.markAsRead(messageId, currentUserId);
    }
  }

  /**
   * Marcar todos los mensajes de un ticket como leídos
   */
  async markAllAsRead(ticketId: number, currentUserId: number): Promise<void> {
    // Verificar acceso al ticket
    await this.ticketsService.findOne(ticketId, currentUserId);

    // Obtener todos los mensajes del ticket que el usuario puede ver
    const canViewInternal = await this.canViewInternalMessages(ticketId, currentUserId);
    
    const queryBuilder = this.messageRepository.createQueryBuilder('message')
      .select('message.id')
      .where('message.ticketId = :ticketId', { ticketId });

    if (!canViewInternal) {
      queryBuilder.andWhere('message.isInternal = false');
    }

    const messages = await queryBuilder.getMany();
    const messageIds = messages.map(m => m.id);

    // Marcar todos como leídos
    if (messageIds.length > 0) {
      await this.markMultipleAsRead(messageIds, currentUserId);
    }
  }

  /**
   * Obtener mensajes no leídos de un ticket
   */
  async getUnreadMessages(ticketId: number, currentUserId: number): Promise<TicketMessage[]> {
    // Verificar acceso al ticket
    await this.ticketsService.findOne(ticketId, currentUserId);

    const canViewInternal = await this.canViewInternalMessages(ticketId, currentUserId);

    const queryBuilder = this.messageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoin('message.reads', 'reads', 'reads.userId = :userId', { userId: currentUserId })
      .where('message.ticketId = :ticketId', { ticketId })
      .andWhere('reads.id IS NULL') // No tiene registro de lectura
      .andWhere('message.senderId != :userId', { userId: currentUserId }); // No incluir sus propios mensajes

    if (!canViewInternal) {
      queryBuilder.andWhere('message.isInternal = false');
    }

    queryBuilder.orderBy('message.createdAt', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Obtener estadísticas de mensajes de un ticket
   */
  async getMessageStats(ticketId: number, currentUserId: number): Promise<any> {
    // Verificar acceso al ticket
    await this.ticketsService.findOne(ticketId, currentUserId);

    const canViewInternal = await this.canViewInternalMessages(ticketId, currentUserId);

    const queryBuilder = this.messageRepository.createQueryBuilder('message')
      .where('message.ticketId = :ticketId', { ticketId });

    if (!canViewInternal) {
      queryBuilder.andWhere('message.isInternal = false');
    }

    const total = await queryBuilder.getCount();

    const unread = await this.getUnreadMessages(ticketId, currentUserId);

    const byType = await queryBuilder
      .select('message.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('message.type')
      .getRawMany();

    const bySender = await queryBuilder
      .leftJoin('message.sender', 'sender')
      .select('sender.firstName', 'firstName')
      .addSelect('sender.lastName', 'lastName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('sender.id, sender.firstName, sender.lastName')
      .getRawMany();

    return {
      total,
      unread: unread.length,
      byType,
      bySender
    };
  }

  /**
   * Eliminar un mensaje (soft delete)
   */
  async remove(id: number, currentUserId: number): Promise<void> {
    const message = await this.findOne(id, currentUserId);

    // Solo el remitente puede eliminar sus mensajes
    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('Solo puedes eliminar tus propios mensajes');
    }

    // No se pueden eliminar mensajes del sistema
    if (message.type === MessageType.SYSTEM) {
      throw new BadRequestException('No se pueden eliminar mensajes del sistema');
    }

    await this.messageRepository.remove(message);
  }

  // Métodos auxiliares privados

  private async checkWritePermissions(ticketId: number, userId: number): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { ticketId, userId }
    });

    if (!participant) {
      throw new ForbiddenException('No eres participante de este ticket');
    }

    // Los observadores no pueden escribir mensajes
    if (!participant.canComment) {
      throw new ForbiddenException('No tienes permisos para escribir mensajes en este ticket');
    }
  }

  private async canViewInternalMessages(ticketId: number, userId: number): Promise<boolean> {
    const participant = await this.participantRepository.findOne({
      where: { ticketId, userId }
    });

    // Solo los participantes pueden ver mensajes internos
    // Podemos asumir que todos los participantes pueden ver mensajes internos por defecto
    return participant !== null;
  }
}
