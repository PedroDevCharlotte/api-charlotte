  
function mapUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority } from './Entity/ticket.entity';
import {
  TicketParticipant,
  ParticipantRole,
} from './Entity/ticket-participant.entity';
import { TicketMessage, MessageType } from './Entity/ticket-message.entity';
import { TicketHistory, HistoryAction } from './Entity/ticket-history.entity';
import { TicketAttachment } from './Entity/ticket-attachment.entity';
import { CreateTicketDto, UpdateTicketDto } from './Dto/ticket.dto';
import { GraphService } from '../../Services/EntraID/graph.service';
import {
  CreateCompleteTicketDto,
  CompleteTicketResponseDto,
} from './Dto/create-complete-ticket.dto';
import { User } from '../users/Entity/user.entity';
import { TicketType } from '../ticket-types/Entity/ticket-type.entity';
import { TicketNotificationService } from './ticket-notification.service';

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assignedTo?: number;
  createdBy?: number;
  departmentId?: number;
  ticketTypeId?: number;
  search?: string;
  tags?: string[];
  isUrgent?: boolean;
  isInternal?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class TicketsService {

  /**
   * Estadística de semáforo de respuesta para tickets de tipo Soporte (SUPPORT)
   * Devuelve el tiempo promedio de cierre por usuario asignado y color del semáforo
   */
  async getSupportTicketsResponseStats(dateFrom?: Date, dateTo?: Date) {
    // Si no se pasan fechas, usar el último mes
    const now = new Date();
    let from = dateFrom;
    let to = dateTo;
    if (!from || !to) {
      to = new Date(now);
      from = new Date(now);
      from.setMonth(from.getMonth() - 1);
    }

    // Buscar tickets cerrados de tipo SUPPORT en el rango
    const tickets = await this.ticketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.assignee', 'assignee')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .where('ticketType.code = :supportCode', { supportCode: 'SOP' })
      .andWhere('ticket.closedAt IS NOT NULL')
      .andWhere('ticket.closedAt BETWEEN :from AND :to', { from, to })
      .getMany();

      // console.log('Tickets encontrados para estadística:', tickets.length);
      // console.log('Informacion encontrados para estadística:', tickets);

    // Agrupar por usuario asignado
    const stats: Record<number, { user: any, total: number, sumHours: number }> = {};
    for (const ticket of tickets) {
      if (!ticket.assignedTo || !ticket.closedAt || !ticket.createdAt) continue;
      const userId = ticket.assignedTo;
      const hours = (ticket.closedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      if (!stats[userId]) {
        stats[userId] = {
          user: ticket.assignee ? {
            id: ticket.assignee.id,
            firstName: ticket.assignee.firstName,
            lastName: ticket.assignee.lastName,
            email: ticket.assignee.email,
          } : { id: userId },
          total: 0,
          sumHours: 0,
        };
      }
      stats[userId].total++;
      stats[userId].sumHours += hours;
    }

    // Calcular promedio y color
    const result = Object.values(stats).map((stat) => {
      const avg = stat.total > 0 ? stat.sumHours / stat.total : 0;
      let color: 'verde' | 'amarillo' | 'rojo' = 'verde';
      if (avg > 48) color = 'rojo';
      else if (avg > 24) color = 'amarillo';
      return {
        user: stat.user,
        promedioHoras: Number(avg.toFixed(2)),
        ticketsCerrados: stat.total,
        semaforo: color,
      };
    });
    return result;
  }
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketParticipant)
    private participantRepository: Repository<TicketParticipant>,
    @InjectRepository(TicketMessage)
    private messageRepository: Repository<TicketMessage>,
    @InjectRepository(TicketHistory)
    private historyRepository: Repository<TicketHistory>,
    @InjectRepository(TicketAttachment)
    private attachmentRepository: Repository<TicketAttachment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TicketType)
    private ticketTypeRepository: Repository<TicketType>,
    private ticketNotificationService: TicketNotificationService,
  @Inject(forwardRef(() => GraphService))
  public readonly graphService: GraphService,
  ) {}

    /**
     * Cancela un ticket, guarda la justificación y notifica al técnico asignado
     */
    async cancelTicket(
      ticketId: number,
      justification: string,
      currentUserId: number,
    ): Promise<Ticket> {
      // Buscar el ticket con el técnico asignado
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
        relations: ['assignee', 'participants', 'participants.user'],
      });
      if (!ticket) throw new NotFoundException('Ticket no encontrado');

      // Verificar permisos de acceso
      await this.checkTicketAccess(ticket, currentUserId);

      // Guardar mensaje de justificación como TicketMessage
      console.log('Justificación de cancelación guardada:', ticket);
      console.log('Justificación de cancelación guardada:', currentUserId);
      console.log('Justificación de cancelación guardada:', justification);

      let aux = await this.messageRepository.save({
        ticketId: ticket.id,
        senderId: currentUserId,
        content: justification,
        type: MessageType.SYSTEM,
        createdAt: new Date(),
      });

      console.log('Justificación de cancelación guardada:', aux);
      // Actualizar estatus a 'cancelled'
      ticket.status = TicketStatus.CANCELLED;
      await this.ticketRepository.save(ticket);

      // Crear registro de historial
      await this.createHistoryRecord(
        ticket.id,
        currentUserId,
        HistoryAction.UPDATED,
        { status: ticket.status },
        { justification },
      );

      // Notificar al técnico asignado por correo
      if (ticket.assignee && ticket.assignee.email) {
        await this.ticketNotificationService.notifyTicketCancelled({
          ticket,
          user: ticket.assignee,
          action: 'cancelled',
          recipients: { to: [ticket.assignee.email] },
          customMessage: justification,
        });
      }

      return ticket;
    }

    /**
     * Solicita al creador del ticket que conteste la encuesta enviando un email con el enlace.
     */
    async requestFeedback(ticketId: number, currentUserId: number): Promise<Ticket> {
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
        relations: ['creator', 'assignee', 'participants']
      });
      if (!ticket) throw new NotFoundException('Ticket no encontrado');

      // Verificar permisos: permitir a quien sea asignado o admin/creator según reglas existentes
      await this.checkTicketAccess(ticket, currentUserId);

      // Enviar email al creador usando TicketNotificationService.notifyTicketClosed (reuse template 'ticket-closed')
      const creatorEmail = ticket.creator?.email;
      if (creatorEmail) {
        await this.ticketNotificationService.notifyTicketClosed({
          ticket,
          user: ticket.creator,
          action: 'closed',
          recipients: { to: [creatorEmail] }
        });
      }

      return ticket;
    }
  async getAttachmentById(id: number) {
    return this.attachmentRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });
  }

  /**
   * Crear un nuevo ticket
   */
  async create(
    createTicketDto: CreateTicketDto,
    currentUserId: number,
  ): Promise<Ticket> {
    // Verificar que el usuario existe
    const creator = await this.userRepository.findOne({
      where: { id: currentUserId },
    });
    if (!creator) {
      throw new NotFoundException('Usuario creador no encontrado');
    }

    // Generar número de ticket único
    const ticketNumber = await this.generateTicketNumber(
      createTicketDto.ticketTypeId,
    );

    // Crear el ticket
    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      ticketNumber,
      createdBy: currentUserId,
      dueDate: createTicketDto.dueDate
        ? new Date(createTicketDto.dueDate)
        : undefined,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // Agregar participantes iniciales
    await this.addInitialParticipants(
      savedTicket.id,
      createTicketDto,
      currentUserId,
    );

    // Crear registro de historial
    await this.createHistoryRecord(
      savedTicket.id,
      currentUserId,
      HistoryAction.CREATED,
      null,
      { ticketNumber: savedTicket.ticketNumber, title: savedTicket.title },
    );

    // Crear mensaje inicial del sistema
    await this.createSystemMessage(
      savedTicket.id,
      currentUserId,
      `Ticket ${savedTicket.ticketNumber} creado`,
      { action: 'ticket_created' },
    );

    return this.findOne(savedTicket.id, currentUserId);
  }

  /**
   * Obtener todos los tickets con filtros
   */

  async findAll(
    filters: TicketFilters,
    currentUserId: number,
  ): Promise<{ tickets: any[]; total: number }> {

    // Obtener usuario con rol, tipos de soporte y subordinados
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['supportTypes', 'role', 'subordinates'],
    });
    const isAdmin = user?.role?.name?.toLowerCase().includes('admin');

    // Obtener todos los IDs de subordinados recursivamente si no es admin
    let allSubordinateIds: number[] = [];
    if (!isAdmin && user) {
      // Implementación directa aquí:
      const getAllSubordinateIds = async (userId: number): Promise<number[]> => {
        const u = await this.userRepository.findOne({ where: { id: userId }, relations: ['subordinates'] });
        let ids: number[] = [];
        if (u && u.subordinates && u.subordinates.length > 0) {
          for (const sub of u.subordinates) {
            ids.push(sub.id);
            ids = ids.concat(await getAllSubordinateIds(sub.id));
          }
        }
        return ids;
      };
      allSubordinateIds = await getAllSubordinateIds(currentUserId);
    }

    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('ticket.creator', 'creator')
      .leftJoinAndSelect('ticket.assignee', 'assignee')
      .leftJoinAndSelect('ticket.department', 'department')
      .leftJoinAndSelect('ticket.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser');

    // Reglas de visibilidad:
    // 1. Si el usuario NO tiene tipos de soporte: solo ve los tickets que él creó.
    // 2. Si tiene tipos de soporte y NO es admin: ve los tickets asignados a él de los tipos de soporte que tiene y los que él creó.
    // 3. Si tiene subordinados, también ve los tickets asignados a sus subordinados.
    // 4. Si es admin: ve todos los tickets.
    if (!isAdmin) {
      if (!user || !user.supportTypes || user.supportTypes.length === 0) {
        // Solo tickets creados por el usuario
        queryBuilder.andWhere('ticket.createdBy = :userId', { userId: currentUserId });
      } else {
        const supportTypeIds = user.supportTypes.map((st) => st.id);
        let where = '(ticket.createdBy = :userId OR (ticket.assignedTo = :userId AND ticket.ticketTypeId IN (:...supportTypeIds))';
        const params: any = { userId: currentUserId, supportTypeIds };
        if (allSubordinateIds.length > 0) {
          where += ' OR (ticket.assignedTo IN (:...subordinateIds))';
          params.subordinateIds = allSubordinateIds;
        }
        where += ')';
        queryBuilder.andWhere(where, params);
      }
    }

    // Aplicar filtros
    if (filters.status?.length) {
      queryBuilder.andWhere('ticket.status IN (:...status)', {
        status: filters.status,
      });
    }

    if (filters.priority?.length) {
      queryBuilder.andWhere('ticket.priority IN (:...priority)', {
        priority: filters.priority,
      });
    }

    if (filters.assignedTo) {
      queryBuilder.andWhere('ticket.assignedTo = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    if (filters.createdBy) {
      queryBuilder.andWhere('ticket.createdBy = :createdBy', {
        createdBy: filters.createdBy,
      });
    }

    if (filters.departmentId) {
      queryBuilder.andWhere('ticket.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }

    if (filters.ticketTypeId) {
      queryBuilder.andWhere('ticket.ticketTypeId = :ticketTypeId', {
        ticketTypeId: filters.ticketTypeId,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(ticket.title ILIKE :search OR ticket.description ILIKE :search OR ticket.ticketNumber ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.isUrgent !== undefined) {
      queryBuilder.andWhere('ticket.isUrgent = :isUrgent', {
        isUrgent: filters.isUrgent,
      });
    }

    if (filters.isInternal !== undefined) {
      queryBuilder.andWhere('ticket.isInternal = :isInternal', {
        isInternal: filters.isInternal,
      });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('ticket.createdAt >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('ticket.createdAt <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

  // (Eliminado: lógica de roles y subordinados, solo se aplican las reglas de soporte y admin)

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Ordenamiento
    queryBuilder.orderBy('ticket.createdAt', 'DESC');

    const [tickets, total] = await queryBuilder.getManyAndCount();
    const formattedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const messages = await Promise.all(
          (ticket.messages || []).map((msg) => this.mapMessage(msg)),
        );
        const attachments = await Promise.all(
          (ticket.attachments || []).map((att) => this.mapAttachment(att)),
        );
        return {
          ...ticket,
          creator: mapUser(ticket.creator),
          assignee: mapUser(ticket.assignee),
          participants: ticket.participants?.map((p) => ({
            ...p,
            user: mapUser(p.user),
          })),
          messages,
          attachments,
          history: ticket.history?.map((h) => ({
            ...h,
            user: mapUser(h.user),
          })),
        };
      }),
    );
    return { tickets: formattedTickets, total };
  }

  /**
   * Obtener un ticket por ID
   */
  async findOne(id: number, currentUserId: number): Promise<any> {
    console.log('Id del usuario', currentUserId);
    // Cargar ticket con relaciones relevantes para poder devolver la lista de participantes
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: [
        'participants',
        'participants.user',
        'creator',
        'assignee',
        'messages',
        'messages.sender',
        'messages.attachments',
        'attachments',
        'history',
        'history.user',
        'ticketType',
        'department',
      ],
    });
    if (!ticket) return null;
    const messages = await Promise.all(
      (ticket.messages || []).map((msg) => this.mapMessage(msg)),
    );
    const attachments = await Promise.all(
      (ticket.attachments || []).map((att) => this.mapAttachment(att)),
    );
    return {
      ...ticket,
      creator: mapUser(ticket.creator),
      assignee: mapUser(ticket.assignee),
      participants: ticket.participants?.map((p) => ({
        ...p,
        user: mapUser(p.user),
      })),
      messages,
      attachments,
      history: ticket.history?.map((h) => ({
        ...h,
        user: mapUser(h.user),
      })),
    };
  }

  private async mapAttachment(att: any): Promise<any> {
    return {
      ...att,
      uploadedBy: mapUser(att.uploadedBy),
      previewUrl: att.oneDriveFileId
        ? await this.getAttachmentPreviewUrl(att.oneDriveFileId)
        : att.filePath || null,
    };
  }

  private async mapMessage(msg: any): Promise<any> {
    const attachments = await Promise.all(
      (msg.attachments || []).map((att) => this.mapAttachment(att)),
    );
    return {
      ...msg,
      sender: mapUser(msg.sender),
      editedByUser: mapUser(msg.editedByUser),
      replyTo: msg.replyTo
        ? {
            ...msg.replyTo,
            sender: mapUser(msg.replyTo.sender),
          }
        : null,
      attachments,
    };
  }
  /**
   * Obtiene el enlace de vista previa de un archivo adjunto en OneDrive
   */
  private async getAttachmentPreviewUrl(
    oneDriveFileId: string,
  ): Promise<string | null> {
    try {
      const userEmail = process.env.ONEDRIVE_USER_EMAIL || '';
      if (!userEmail) return null;
      const userRes = await this.graphService.getUserByEmail(userEmail);
      const userId =
        userRes.value && userRes.value.length > 0 ? userRes.value[0].id : null;
      if (!userId) return null;
      const previewRes = await this.graphService.getFilePreview(
        userId,
        oneDriveFileId,
      );
      return previewRes?.link?.webUrl || null;
    } catch {
      return null;
    }
  }

  /**
   * Actualizar un ticket
   */
  async update(
    id: number,
    updateTicketDto: UpdateTicketDto,
    currentUserId: number,
  ): Promise<Ticket> {
    // Cargar la entidad directamente desde el repositorio (no la versión "mapeada" que devuelve findOne())
    const ticketEntity = await this.ticketRepository.findOne({
      where: { id },
      relations: [
        'participants',
        'participants.user',
        'creator',
        'assignee',
        'department',
      ],
    });

    if (!ticketEntity) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    // Verificar permisos de acceso y edición
    await this.checkTicketAccess(ticketEntity, currentUserId);
    await this.checkEditPermissions(ticketEntity, currentUserId);

    const oldValues = { ...ticketEntity } as any;

    // Aplicar actualizaciones al entity. IMPORTANT: omit participants from the assignment
    // because saving the parent with plain participant objects causes TypeORM to try to
    // persist them (and may generate UPDATEs that set ticketId = NULL). We'll sync
    // participants explicitly after saving the ticket.
    const { participants: _participants, ...dtoWithoutParticipants } =
      updateTicketDto as any;
    Object.assign(ticketEntity, {
      ...dtoWithoutParticipants,
      dueDate: updateTicketDto.dueDate
        ? new Date(updateTicketDto.dueDate)
        : ticketEntity.dueDate,
    });

    // Manejar cambios de estado especiales: setear fechas relacionadas ANTES de persistir
    if (updateTicketDto.status) {
      if (
        updateTicketDto.status === TicketStatus.COMPLETED &&
        !ticketEntity.resolvedAt
      ) {
        ticketEntity.resolvedAt = new Date();
      }
      if (
        updateTicketDto.status === TicketStatus.CLOSED &&
        !ticketEntity.closedAt
      ) {
        ticketEntity.closedAt = new Date();
      }
      // Note: notifications will be sent after the ticket is saved so email templates
      // see the new status. We will call handleStatusChange after saving below.
    }

    const savedTicket = await this.ticketRepository.save(ticketEntity);

    // Crear registro de historial
    await this.createHistoryRecord(
      id,
      currentUserId,
      HistoryAction.UPDATED,
      this.extractRelevantFields(oldValues),
      this.extractRelevantFields(savedTicket),
    );

    // Si hubo cambio de estado, ahora que el ticket está persistido, notificar el cambio
    try {
      // If status changed to CLOSED, calculate working hours and persist them before sending notifications
      if ((updateTicketDto as any).status) {
        if ((savedTicket as any).status === TicketStatus.CLOSED) {
          try {
            const start =
              (savedTicket as any).resolvedAt ||
              (savedTicket as any).createdAt ||
              null;
            const end = (savedTicket as any).closedAt || new Date();
            if (start) {
              const hours = this.calculateWorkingHours(start, end);
              // Persist computed hours: store float in customFields.workingHours and rounded int in actualHours
              const customFields = (savedTicket as any).customFields
                ? { ...(savedTicket as any).customFields }
                : {};
              customFields.workingHours = hours;
              await this.ticketRepository.update(
                { id: savedTicket.id },
                { customFields, actualHours: Math.round(hours) },
              );
              // reflect in savedTicket for downstream notifications
              (savedTicket as any).customFields = customFields;
              (savedTicket as any).actualHours = Math.round(hours);
            }
          } catch (err) {
            console.error(
              'Error calculando horas trabajadas al cerrar ticket (update):',
              err,
            );
          }
        }

        await this.handleStatusChange(
          savedTicket as any,
          oldValues.status,
          (savedTicket as any).status,
          currentUserId,
        );
      }
    } catch (err) {
      console.error(
        'Error enviando notificación de cambio de estado después de guardar:',
        err,
      );
    }

    // Enviar notificación de actualización (no bloquear la respuesta)
    try {
      const recipients = await this.buildEmailRecipients(
        savedTicket.id,
        currentUserId,
      );
      const actor =
        (await this.userRepository.findOne({ where: { id: currentUserId } })) ||
        ({ id: currentUserId, firstName: '', lastName: '', email: '' } as any);
      const ticketForEmail = await this.findOne(savedTicket.id, currentUserId);
      this.ticketNotificationService
        .notifyTicketUpdated({
          ticket: ticketForEmail,
          action: 'updated',
          user: actor as User,
          previousValues: this.extractRelevantFields(oldValues),
          recipients,
        })
        .catch((err) => {
          console.error('Error enviando notificación de actualización:', err);
        });
    } catch (err) {
      console.error('Error preparando notificación de actualización:', err);
    }

    // Si se enviaron participantes, sincronizar la lista
    try {
      if (
        (updateTicketDto as any).participants &&
        Array.isArray((updateTicketDto as any).participants)
      ) {
        const newList: any[] = (updateTicketDto as any).participants;
        // Mapear por userId para facilitar operaciones
        const newByUser = new Map<number, any>();
        for (const p of newList) {
          if (!p || !p.userId) continue;
          newByUser.set(Number(p.userId), p);
        }

        const existingParticipants = await this.participantRepository.find({
          where: { ticketId: id },
        });
        const existingByUser = new Map<number, any>();
        for (const ep of existingParticipants)
          existingByUser.set(ep.userId, ep);

        // Crear o actualizar
        for (const [userId, pdata] of newByUser.entries()) {
          const userIdNum = Number(userId);
          const existing = existingByUser.get(userIdNum);
          if (existing) {
            // actualizar campos permitidos
            if (pdata.role !== undefined) existing.role = pdata.role;
            if (pdata.canComment !== undefined)
              existing.canComment = pdata.canComment;
            if (pdata.canEdit !== undefined) existing.canEdit = pdata.canEdit;
            if (pdata.canClose !== undefined)
              existing.canClose = pdata.canClose;
            if (pdata.canAssign !== undefined)
              existing.canAssign = pdata.canAssign;
            if (pdata.receiveNotifications !== undefined)
              existing.receiveNotifications = pdata.receiveNotifications;
            await this.participantRepository.update(
              { id: existing.id },
              {
                role: existing.role,
                canComment: existing.canComment,
                canEdit: existing.canEdit,
                canClose: existing.canClose,
                canAssign: existing.canAssign,
                receiveNotifications: existing.receiveNotifications,
              },
            );
          } else {
            // crear nuevo participante; role por defecto COLLABORATOR si no viene
            const role = pdata.role || ParticipantRole.COLLABORATOR;
            const newParticipant = this.participantRepository.create({
              ticketId: id,
              userId: userIdNum,
              role,
              canComment:
                pdata.canComment !== undefined ? pdata.canComment : true,
              canEdit: pdata.canEdit !== undefined ? pdata.canEdit : false,
              canClose: pdata.canClose !== undefined ? pdata.canClose : false,
              canAssign:
                pdata.canAssign !== undefined ? pdata.canAssign : false,
              receiveNotifications:
                pdata.receiveNotifications !== undefined
                  ? pdata.receiveNotifications
                  : true,
              addedBy: currentUserId,
            });
            await this.participantRepository.save(newParticipant);
          }
        }

        // Eliminar participantes que no estén en la nueva lista (salvo el creador y el asignado)
        for (const ep of existingParticipants) {
          const keepCreator = ep.role === ParticipantRole.CREATOR;
          const isAssignee = ep.userId === savedTicket.assignedTo;
          if (keepCreator || isAssignee) continue; // no eliminar
          if (!newByUser.has(ep.userId)) {
            // Use delete by id to avoid unintended updates that set ticketId = NULL
            await this.participantRepository.delete({ id: ep.id });
          }
        }
      }
    } catch (err) {
      console.error('Error sincronizando participantes:', err);
      // no bloquear la respuesta por errores al sincronizar participantes
    }

    // Devolver la representación completa y mapeada
    return this.findOne(id, currentUserId);
  }

  /**
   * Asignar ticket a un usuario
   */
  async assignTicket(
    ticketId: number,
    assigneeId: number,
    currentUserId: number,
  ): Promise<Ticket> {
    const ticket = await this.findOne(ticketId, currentUserId);

    // Verificar permisos
    await this.checkAssignPermissions(ticket, currentUserId);
    // Buscar el nuevo usuario asignado
    const newAssignee = await this.userRepository.findOne({
      where: { id: assigneeId },
    });
    if (!newAssignee) {
      throw new NotFoundException('Usuario asignado no encontrado');
    }
    const oldAssignee = ticket.assignedTo;
    ticket.assignedTo = assigneeId;
    ticket.assignee = newAssignee;

    await this.ticketRepository.save(ticket);

    // Agregar como participante si no lo es
    await this.ensureParticipant(
      ticketId,
      assigneeId,
      ParticipantRole.ASSIGNEE,
      currentUserId,
    );

    // Eliminar al asesor anterior de los participantes relacionados si cambió
    if (oldAssignee && oldAssignee !== assigneeId) {
      try {
        const prevParticipant = await this.participantRepository.findOne({
          where: { ticketId, userId: oldAssignee },
        });
        if (prevParticipant) {
          await this.participantRepository.delete({ id: prevParticipant.id });
        }
      } catch (err) {
        console.error(
          `Error eliminando participante anterior (userId: ${oldAssignee}) del ticket ${ticketId}:`,
          err,
        );
      }
    }

    // Crear mensaje del sistema
    const assignee = await this.userRepository.findOne({
      where: { id: assigneeId },
    });
    if (!assignee) {
      throw new NotFoundException('Usuario asignado no encontrado');
    }

    await this.createSystemMessage(
      ticketId,
      currentUserId,
      `Ticket asignado a ${assignee.firstName} ${assignee.lastName}`,
      { action: 'assigned', oldAssignee, newAssignee: assigneeId },
    );

    // Historial
    await this.createHistoryRecord(
      ticketId,
      currentUserId,
      HistoryAction.ASSIGNED,
      { assignedTo: oldAssignee },
      { assignedTo: assigneeId },
    );

    // Enviar notificación de reasignación siempre al nuevo asignado (no bloquear la respuesta)
    try {
      const actor =
        (await this.userRepository.findOne({ where: { id: currentUserId } })) ||
        ({ id: currentUserId, firstName: '', lastName: '', email: '' } as any);
      const ticketForEmail = await this.findOne(ticketId, currentUserId);
      const assigneeEmail = assignee.email;
      const recipients = assigneeEmail ? { to: [assigneeEmail] } : { to: [] };
      this.ticketNotificationService
        .notifyTicketAssigned({
          ticket: ticketForEmail,
          action: 'assigned',
          user: actor as User,
          previousValues: { assignedTo: oldAssignee },
          recipients,
        })
        .catch((err) => {
          console.error('Error enviando notificación de reasignación:', err);
        });
    } catch (err) {
      console.error('Error preparando notificación de reasignación:', err);
    }

    return this.findOne(ticketId, currentUserId);
  }

  /**
   * Cerrar un ticket
   */
  async closeTicket(
    ticketId: number,
    resolution: string,
    currentUserId: number,
  ): Promise<Ticket> {
    const ticket = await this.findOne(ticketId, currentUserId);

    // Verificar permisos
    await this.checkClosePermissions(ticket, currentUserId);

    ticket.status = TicketStatus.CLOSED;
    ticket.closedAt = new Date();
    // Persist the resolution text so templates can display it
    ticket.resolution = resolution;

    if (!ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }

    // Before saving, compute working hours between resolvedAt (or createdAt) and closedAt
    try {
      const start = ticket.createdAt || null;
      const end = new Date();
      if (start) {
        const hours = this.calculateWorkingHours(start, end);
        const customFields = ticket.customFields
          ? { ...ticket.customFields }
          : {};
        customFields.workingHours = hours;
        ticket.customFields = customFields;
        ticket.actualHours = Math.round(hours);
      }
    } catch (err) {
      console.error(
        'Error calculando horas trabajadas al cerrar ticket (closeTicket):',
        err,
      );
    }

    await this.ticketRepository.save(ticket);

    // Crear mensaje de cierre
    await this.createSystemMessage(
      ticketId,
      currentUserId,
      `Ticket cerrado: ${resolution}`,
      { action: 'closed', resolution },
    );

    // Historial
    await this.createHistoryRecord(
      ticketId,
      currentUserId,
      HistoryAction.CLOSED,
      { status: TicketStatus.COMPLETED },
      { status: TicketStatus.CLOSED, closedAt: ticket.closedAt },
    );

    // Enviar notificación de cierre solo al creador (no bloquear respuesta)
    try {
      const actor =
        (await this.userRepository.findOne({ where: { id: currentUserId } })) ||
        ({ id: currentUserId, firstName: '', lastName: '', email: '' } as any);
      const ticketForEmail = await this.findOne(ticketId, currentUserId);
      const creatorEmail = ticketForEmail?.creator?.email;
      const recipients = creatorEmail ? { to: [creatorEmail] } : { to: [] };
      this.ticketNotificationService
        .notifyTicketClosed({
          ticket: ticketForEmail,
          action: 'closed',
          user: actor as User,
          previousValues: { status: TicketStatus.COMPLETED },
          recipients,
          // include the resolution as customMessage so templates render the closure message
          customMessage: resolution,
        })
        .catch((err) => {
          console.error('Error enviando notificación de cierre:', err);
        });
    } catch (err) {
      console.error('Error preparando notificación de cierre:', err);
    }

    return this.findOne(ticketId, currentUserId);
  }



  /**
   * Eliminar un ticket (soft delete)
   */
  async remove(id: number, currentUserId: number): Promise<void> {
    const ticket = await this.findOne(id, currentUserId);

    // Solo el creador o admin puede eliminar
    if (ticket.createdBy !== currentUserId) {
      // TODO: Verificar si es admin
      throw new ForbiddenException(
        'No tienes permisos para eliminar este ticket',
      );
    }

    // Guardar mensaje de sistema antes de eliminar el ticket
    await this.createSystemMessage(
      id,
      currentUserId,
      `Ticket eliminado`,
      { action: 'deleted' },
    );

    // Guardar historial antes de eliminar el ticket
    await this.createHistoryRecord(
      id,
      currentUserId,
      HistoryAction.DELETED,
      this.extractRelevantFields(ticket),
      null,
    );

    // Eliminar el ticket
    await this.ticketRepository.remove(ticket);
  }

  /**
   * Obtener estadísticas de tickets
   */
  async getStatistics(currentUserId: number): Promise<any> {
    // Aplicar las mismas reglas de visibilidad que en findAll()
    const user = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['supportTypes', 'role'],
    });
    const isAdmin = user?.role?.name?.toLowerCase().includes('admin');

    const applyVisibilityRules = (qb: any) => {
      if (isAdmin) {
        // Admin: ve todos los tickets
        return qb;
      }
      if (!user || !user.supportTypes || user.supportTypes.length === 0) {
        // Solo tickets creados por el usuario
        return qb.andWhere('ticket.createdBy = :userId', { userId: currentUserId });
      } else {
        // Tickets asignados a él de los tipos de soporte que tiene y los que él creó
        const supportTypeIds = user.supportTypes.map((st: any) => st.id);
        return qb.andWhere(
          '(ticket.createdBy = :userId OR (ticket.assignedTo = :userId AND ticket.ticketTypeId IN (:...supportTypeIds)))',
          { userId: currentUserId, supportTypeIds },
        );
      }
    };

    // Total y agrupados aplicando reglas de visibilidad
    const total = await applyVisibilityRules(
      this.ticketRepository.createQueryBuilder('ticket'),
    ).getCount();

    const byStatusRaw = await applyVisibilityRules(
      this.ticketRepository.createQueryBuilder('ticket'),
    )
      .select('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.status')
      .getRawMany();

    const byPriority = await applyVisibilityRules(
      this.ticketRepository.createQueryBuilder('ticket'),
    )
      .select('ticket.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.priority')
      .getRawMany();

    // Contadores específicos: assigned => tickets realmente asignados (solo los que puede ver el usuario)
    let assignedQb = this.ticketRepository.createQueryBuilder('ticket');
    assignedQb = applyVisibilityRules(assignedQb).andWhere('ticket.assignedTo = :userId', { userId: currentUserId });
    const assigned = await assignedQb.getCount();

    // created => tickets creados por el usuario (siempre solo los que él creó)
    const created = await this.ticketRepository
      .createQueryBuilder('ticket')
      .andWhere('ticket.createdBy = :userId', { userId: currentUserId })
      .getCount();

    // Construir array de últimos 10 meses (desde el mes actual hacia atrás)
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(ym);
    }

    // Fecha de inicio para la consulta (primer día del mes más antiguo)
    const oldest = new Date(now.getFullYear(), now.getMonth() - 9, 1);

    // Agrupar por status, ticketTypeId y mes en una sola consulta
    const monthlyRaw = await applyVisibilityRules(
      this.ticketRepository.createQueryBuilder('ticket'),
    )
      .select('ticket.status', 'status')
      .addSelect('ticket.ticketTypeId', 'ticketTypeId')
      .addSelect("DATE_FORMAT(ticket.createdAt, '%Y-%m')", 'ym')
      .addSelect('COUNT(*)', 'count')
      .andWhere('ticket.createdAt >= :oldest', { oldest })
      .groupBy('ticket.status')
      .addGroupBy('ticket.ticketTypeId')
      .addGroupBy('ym')
      .getRawMany();

    // Obtener todos los tipos de ticket para devolver nombres
    const ticketTypes = await this.ticketTypeRepository.find();
    const typeMap = new Map<number, string>();
    for (const t of ticketTypes)
      typeMap.set((t as any).id, (t as any).name || '');

    // Construir byStatus enriquecido: para cada status, incluir tipos con conteo mensual
    const byStatus: Array<any> = [];

    // Inicializar entries de status a partir de byStatusRaw
    for (const row of byStatusRaw) {
      const status = String(row.status);
      const count = Number(row.count) || 0;
      // Inicializar types para cada status con zeroed months
      const types = [] as Array<{
        ticketTypeId: number;
        ticketTypeName: string;
        counts: Array<{ month: string; count: number }>;
      }>;
      for (const [id, name] of typeMap.entries()) {
        types.push({
          ticketTypeId: id,
          ticketTypeName: name,
          counts: months.map((m) => ({ month: m, count: 0 })),
        });
      }
      byStatus.push({ status, count, types });
    }

    // Rellenar por status -> type -> month usando monthlyRaw
    for (const row of monthlyRaw) {
      const status = String(row.status);
      const ticketTypeId = Number(row.ticketTypeId);
      const ym = row.ym;
      const cnt = Number(row.count) || 0;
      const statusEntry = byStatus.find((s) => s.status === status);
      if (!statusEntry) {
        // Si no existía (posible), crear uno nuevo con zeros
        const types = [] as Array<{
          ticketTypeId: number;
          ticketTypeName: string;
          counts: Array<{ month: string; count: number }>;
        }>;
        for (const [id, name] of typeMap.entries())
          types.push({
            ticketTypeId: id,
            ticketTypeName: name,
            counts: months.map((m) => ({ month: m, count: 0 })),
          });
        byStatus.push({ status, count: 0, types });
      }
      const targetStatus = byStatus.find((s) => s.status === status)!;
      const typeEntry = targetStatus.types.find(
        (t: any) => t.ticketTypeId === ticketTypeId,
      );
      if (typeEntry) {
        const idx = typeEntry.counts.findIndex((c: any) => c.month === ym);
        if (idx >= 0) typeEntry.counts[idx].count = cnt;
      } else {
        // agregar nuevo typeEntry si no estaba en map
        targetStatus.types.push({
          ticketTypeId,
          ticketTypeName: typeMap.get(ticketTypeId) || '',
          counts: months.map((m) => ({ month: m, count: m === ym ? cnt : 0 })),
        });
      }
    }

    return {
      total,
      assigned,
      created,
      byStatus,
      byPriority,
      months, // incluir meses de referencia en la respuesta
    };
  }

  /**
   * Resumen por asesor técnico: total de tickets por estatus para cada asesor (incluye unassigned)
   */
  async getSummaryByAdvisor(currentUserId: number): Promise<any> {
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['role', 'subordinates'],
    });
    const roleName = (currentUser?.role?.name || '').toLowerCase();

    const applyRoleFilters = (qb: any) => {
      if (roleName.includes('admin') || roleName.includes('administrador')) {
        return qb;
      } else if (
        roleName.includes('gerente') ||
        roleName.includes('manager') ||
        roleName.includes('jefe')
      ) {
        const subIds = (currentUser?.subordinates || [])
          .map((s: any) => s.id)
          .filter(Boolean);
        if (subIds.length > 0) {
          return qb.andWhere(
            '(ticket.createdBy = :userId OR ticket.assignedTo = :userId OR ticket.assignedTo IN (:...subIds))',
            { userId: currentUserId, subIds },
          );
        }
        return qb.andWhere(
          '(ticket.createdBy = :userId OR ticket.assignedTo = :userId)',
          { userId: currentUserId },
        );
      } else if (
        roleName.includes('tec') ||
        roleName.includes('soporte') ||
        roleName.includes('technician')
      ) {
        return qb.andWhere(
          '(ticket.createdBy = :userId OR ticket.assignedTo = :userId)',
          { userId: currentUserId },
        );
      }
      return qb.andWhere('ticket.createdBy = :userId', { userId: currentUserId });
    };

    const raw = await applyRoleFilters(
      this.ticketRepository.createQueryBuilder('ticket'),
    )
      .select('ticket.assignedTo', 'assignedTo')
      .addSelect('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.assignedTo')
      .addGroupBy('ticket.status')
      .getRawMany();

    const map = new Map<any, any>();
    for (const row of raw) {
      const assignedTo = row.assignedTo !== null ? Number(row.assignedTo) : 'unassigned';
      const status = String(row.status);
      const cnt = Number(row.count) || 0;
      if (!map.has(assignedTo)) {
        map.set(assignedTo, {
          advisorId: assignedTo === 'unassigned' ? null : assignedTo,
          advisorName: '',
          counts: {},
        });
      }
      const entry = map.get(assignedTo);
      entry.counts[status] = (entry.counts[status] || 0) + cnt;
    }

    // Resolver nombres de usuarios para los IDs numéricos
    const numericIds = Array.from(map.keys()).filter((k) => k !== 'unassigned').map((k) => Number(k));
    if (numericIds.length > 0) {
      const users = await this.userRepository.findByIds(numericIds);
      for (const u of users) {
        if (map.has(u.id)) {
          const e = map.get(u.id);
          e.advisorName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
        }
      }
    }
    if (map.has('unassigned')) {
      const e = map.get('unassigned');
      e.advisorName = 'Unassigned';
    }

    // Calcular tiempo promedio de resolución por advisor (solo tickets cerrados)
    const closedStatuses = ['CLOSED', 'COMPLETED'];
    const closedTickets = await applyRoleFilters(
      this.ticketRepository.createQueryBuilder('ticket'),
    )
      .select(['ticket.assignedTo', 'ticket.createdAt', 'ticket.closedAt', 'ticket.resolvedAt', 'ticket.status'])
      .where('ticket.assignedTo IS NOT NULL')
      .andWhere('ticket.status IN (:...closedStatuses)', { closedStatuses })
      .andWhere('(ticket.closedAt IS NOT NULL OR ticket.resolvedAt IS NOT NULL)')
      .getRawMany();

    // Agrupar por assignedTo y calcular promedio en horas
    const resolutionTimes: Record<number, number[]> = {};
    for (const t of closedTickets) {
      const assignedTo = t.ticket_assignedTo;
      const createdAt = t.ticket_createdAt;
      const closedAt = t.ticket_closedAt || t.ticket_resolvedAt;
      if (assignedTo && createdAt && closedAt) {
        const start = new Date(createdAt).getTime();
        const end = new Date(closedAt).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          const hours = (end - start) / (1000 * 60 * 60);
          if (!resolutionTimes[assignedTo]) resolutionTimes[assignedTo] = [];
          resolutionTimes[assignedTo].push(hours);
        }
      }
    }

    const advisors = Array.from(map.values());
    for (const advisor of advisors) {
      const arr = advisor.advisorId ? resolutionTimes[advisor.advisorId] : undefined;
      if (arr && arr.length > 0) {
        advisor.avgResolutionHours = Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
      } else {
        advisor.avgResolutionHours = null;
      }
    }
    return { advisors };
  }

  // Métodos auxiliares privados

  private async generateTicketNumber(ticketTypeId: number): Promise<string> {
    // Obtener el tipo de ticket para conseguir el código
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { id: ticketTypeId },
    });

    if (!ticketType) {
      throw new NotFoundException('Tipo de ticket no encontrado');
    }

    const code = ticketType.code || 'TKT'; // Usar 'TKT' como fallback si no hay código
    const year = new Date().getFullYear();

    // Obtener el último ticket del mismo tipo para generar el consecutivo
    const lastTicket = await this.ticketRepository.findOne({
      where: { ticketTypeId },
      order: { id: 'DESC' },
    });

    // Extraer el consecutivo del último ticket si existe
    let nextConsecutive = 1;
    if (lastTicket && lastTicket.ticketNumber) {
      const parts = lastTicket.ticketNumber.split('-');
      if (parts.length >= 3) {
        const lastConsecutive = parseInt(parts[2]);
        if (!isNaN(lastConsecutive)) {
          nextConsecutive = lastConsecutive + 1;
        }
      }
    }

    // Formatear el consecutivo con al menos 4 dígitos
    const consecutiveFormatted = nextConsecutive.toString().padStart(4, '0');

    return `${code}-${year}-${consecutiveFormatted}`;
  }

  private async addInitialParticipants(
    ticketId: number,
    createDto: CreateTicketDto,
    currentUserId: number,
  ): Promise<void> {
    // Agregar creador como participante
    await this.ensureParticipant(
      ticketId,
      currentUserId,
      ParticipantRole.CREATOR,
      currentUserId,
    );

    // Agregar asignado si se especifica
    if (createDto.assignedTo) {
      await this.ensureParticipant(
        ticketId,
        createDto.assignedTo,
        ParticipantRole.ASSIGNEE,
        currentUserId,
      );
    }

    // Agregar participantes adicionales
    if (createDto.participantIds?.length) {
      for (const participantId of createDto.participantIds) {
        await this.ensureParticipant(
          ticketId,
          participantId,
          ParticipantRole.COLLABORATOR,
          currentUserId,
        );
      }
    }
  }

  private async ensureParticipant(
    ticketId: number,
    userId: number,
    role: ParticipantRole,
    addedBy: number,
  ): Promise<void> {
    const existing = await this.participantRepository.findOne({
      where: { ticketId, userId },
    });

    if (!existing) {
      const participant = this.participantRepository.create({
        ticketId,
        userId,
        role,
        addedBy,
      });
      await this.participantRepository.save(participant);
    }
  }

  private async createSystemMessage(
    ticketId: number,
    userId: number,
    content: string,
    metadata?: any,
  ): Promise<void> {
    if (!ticketId) throw new Error('ticketId inválido al crear mensaje de sistema');
    const message = this.messageRepository.create({
      ticketId,
      senderId: userId,
      content,
      type: MessageType.SYSTEM,
      metadata,
      isInternal: true,
    });
    await this.messageRepository.insert(message);
  }

  private async createHistoryRecord(
    ticketId: number,
    userId: number,
    action: HistoryAction,
    oldValues: any,
    newValues: any,
  ): Promise<void> {
    if (!ticketId) throw new Error('ticketId inválido al crear historial');
    const history = this.historyRepository.create({
      ticketId,
      userId,
      action,
      oldValues,
      newValues,
    });
    await this.historyRepository.insert(history);
  }

  private async checkTicketAccess(
    ticket: Ticket,
    userId: number,
  ): Promise<void> {
    const isParticipant = ticket.participants?.some((p) => p.userId === userId);
    const isCreator = ticket.createdBy === userId;
    const isAssignee = ticket.assignedTo === userId;

    if (!isParticipant && !isCreator && !isAssignee) {
      throw new ForbiddenException('No tienes acceso a este ticket');
    }
  }

  private async checkEditPermissions(
    ticket: Ticket,
    userId: number,
  ): Promise<void> {
    const participant = ticket.participants?.find((p) => p.userId === userId);
    const isCreator = ticket.createdBy === userId;
    const canEdit = participant?.canEdit || isCreator;

    if (!canEdit) {
      throw new ForbiddenException(
        'No tienes permisos para editar este ticket',
      );
    }
  }

  private async checkAssignPermissions(
    ticket: Ticket,
    userId: number,
  ): Promise<void> {
    const participant = ticket.participants?.find((p) => p.userId === userId);
    const isCreator = ticket.createdBy === userId;
    const canAssign = participant?.canAssign || isCreator;

    // Permitir si es administrador
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    const isAdmin = user?.role?.name?.toLowerCase().includes('admin');

    if (!canAssign && !isAdmin) {
      throw new ForbiddenException(
        'No tienes permisos para asignar este ticket',
      );
    }
  }

  private async checkClosePermissions(
    ticket: Ticket,
    userId: number,
  ): Promise<void> {
    const participant = ticket.participants?.find((p) => p.userId === userId);
    const isCreator = ticket.createdBy === userId;
    const isAssignee = ticket.assignedTo === userId;
    const canClose = participant?.canClose || isCreator || isAssignee;

    if (!canClose) {
      throw new ForbiddenException(
        'No tienes permisos para cerrar este ticket',
      );
    }
  }

  private async handleStatusChange(
    ticket: Ticket,
    oldStatus: TicketStatus,
    newStatus: TicketStatus,
    userId: number,
  ): Promise<void> {
    // Crear mensaje del sistema para cambio de estado
    await this.createSystemMessage(
      ticket.id,
      userId,
      `Estado cambiado de ${oldStatus} a ${newStatus}`,
      { action: 'status_changed', oldStatus, newStatus },
    );

    // Notificar por correo a participantes, asignado y creador (excluyendo al actor)
    try {
      const recipients = await this.buildEmailRecipients(ticket.id, userId);
      const actor =
        (await this.userRepository.findOne({ where: { id: userId } })) ||
        ({ id: userId, firstName: '', lastName: '', email: '' } as any);
      const ticketForEmail = await this.findOne(ticket.id, userId);
      // Enviar notificación de cambio de estado (no bloquear flujo)
      this.ticketNotificationService
        .notifyTicketStatusChanged({
          ticket: ticketForEmail,
          action: 'status_changed',
          user: actor as User,
          previousValues: { status: oldStatus },
          recipients,
        })
        .catch((err) => {
          console.error(
            'Error enviando notificación de cambio de estado:',
            err,
          );
        });
    } catch (err) {
      console.error('Error preparando notificación de cambio de estado:', err);
    }
  }

  /**
   * Construir lista de destinatarios de email para un ticket, excluyendo opcionalmente al actor
   */
  async buildEmailRecipients(
    ticketId: number,
    actorId?: number,
  ): Promise<{ to: string[]; cc?: string[] }> {
    // Obtener ticket con creador y asignado
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['creator', 'assignee'],
    });
    if (!ticket)
      throw new NotFoundException(`Ticket con ID ${ticketId} no encontrado`);

    // Obtener participantes
    const participants = await this.participantRepository.find({
      where: { ticketId },
      relations: ['user'],
    });

    // Build participant emails excluding creator and assignee (they are actors)
    const participantEmails: string[] = [];
    for (const p of participants) {
      if (p.user && p.user.email) {
        const email = (p.user.email || '').toString().trim();
        if (
          email &&
          email !== ticket.creator?.email &&
          email !== ticket.assignee?.email
        )
          participantEmails.push(email);
      }
    }

    // Build primary 'to' - prefer assignee, otherwise creator
    const to: string[] = [];
    if (ticket.assignee && ticket.assignee.email)
      to.push(ticket.assignee.email.trim());
    else if (ticket.creator && ticket.creator.email)
      to.push(ticket.creator.email.trim());

    // Build cc from participants (deduplicated)
    const isValidEmail = (e: string) =>
      typeof e === 'string' && /.+@.+\..+/.test(e.trim());
    const cc = Array.from(
      new Set(
        participantEmails.map((e) => e.toString().trim()).filter(isValidEmail),
      ),
    );

    // Excluir actor si aplica
    if (actorId) {
      const actor = await this.userRepository.findOne({
        where: { id: actorId },
      });
      if (actor && actor.email) {
        const actorEmail = actor.email.trim();
        // remove actor from 'to' and 'cc'
        for (let i = to.length - 1; i >= 0; i--)
          if (to[i] === actorEmail) to.splice(i, 1);
        for (let i = cc.length - 1; i >= 0; i--)
          if (cc[i] === actorEmail) cc.splice(i, 1);
      }
    }

    return { to: Array.from(new Set(to)), cc: cc.length ? cc : undefined };
  }

  private extractRelevantFields(ticket: any): any {
    const {
      id,
      ticketNumber,
      title,
      description,
      status,
      priority,
      assignedTo,
      departmentId,
      ...rest
    } = ticket;
    return {
      id,
      ticketNumber,
      title,
      description,
      status,
      priority,
      assignedTo,
      departmentId,
    };
  }

  /**
   * Calcula horas laborales entre dos fechas excluyendo fines de semana y hora de almuerzo.
   * Devuelve un número con 2 decimales.
   */
  private calculateWorkingHours(
    startDateInput: Date | string,
    endDateInput: Date | string,
  ): number {
    const startHour = 8; // 08:00
    const lunchStartHour = 13; // 13:00
    const lunchEndHour = 14; // 14:00
    const endHour = 17; // 17:00

    const startDateObj = new Date(startDateInput as any);
    const endDateObj = new Date(endDateInput as any);
    let totalHours = 0;

    const currentDate = new Date(startDateObj);

    // Normalize times to avoid infinite loop if invalid range
    if (
      isNaN(startDateObj.getTime()) ||
      isNaN(endDateObj.getTime()) ||
      startDateObj > endDateObj
    )
      return 0;

    while (currentDate <= endDateObj) {
      const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Mon-Fri
        let startHourOfDay = startHour;
        let endHourOfDay = endHour;

        if (currentDate.toDateString() === startDateObj.toDateString()) {
          startHourOfDay = Math.max(
            startHour,
            startDateObj.getHours() + startDateObj.getMinutes() / 60,
          );
        }

        if (currentDate.toDateString() === endDateObj.toDateString()) {
          endHourOfDay = Math.min(
            endHour,
            endDateObj.getHours() + endDateObj.getMinutes() / 60,
          );
        }

        let workedHours = Math.max(0, endHourOfDay - startHourOfDay);

        if (startHourOfDay < lunchStartHour && endHourOfDay > lunchEndHour) {
          workedHours -= 1;
        }

        totalHours += workedHours;
      }
      currentDate.setDate(currentDate.getDate() + 1);
      // reset time to midnight to ensure comparisons work correctly
      currentDate.setHours(0, 0, 0, 0);
    }

    return parseFloat(totalHours.toFixed(2));
  }

  /**
   * Crear un ticket completo con todas las funcionalidades integradas
   */
  async createCompleteTicket(
    createCompleteTicketDto: CreateCompleteTicketDto,
  ): Promise<CompleteTicketResponseDto> {
    // 1. Validar que el usuario que crea el ticket existe
    const creator = await this.userRepository.findOne({
      where: { id: createCompleteTicketDto.createdByUserId },
      relations: ['department', 'role'],
    });
    if (!creator) {
      throw new NotFoundException(
        `Usuario con ID ${createCompleteTicketDto.createdByUserId} no encontrado`,
      );
    }

    // 2. Validar que el tipo de ticket existe y obtener el usuario por defecto
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { id: createCompleteTicketDto.ticketTypeId },
      relations: ['defaultUser'],
    });
    if (!ticketType) {
      throw new NotFoundException(
        `Tipo de ticket con ID ${createCompleteTicketDto.ticketTypeId} no encontrado`,
      );
    }

    // 3. Determinar el usuario asignado
    let assignedUser: User | null = null;
    let autoAssigned = false;
    let assignmentReason = '';
    let defaultUserUsed = false;

    if (createCompleteTicketDto.assignedTo) {
      // Usuario específico asignado manualmente
      assignedUser = await this.userRepository.findOne({
        where: { id: createCompleteTicketDto.assignedTo },
      });
      if (!assignedUser) {
        throw new NotFoundException(
          `Usuario asignado con ID ${createCompleteTicketDto.assignedTo} no encontrado`,
        );
      }
      assignmentReason = 'Usuario asignado manualmente';
    } else if (ticketType.defaultUser) {
      // Usar usuario por defecto del tipo de ticket
      assignedUser = ticketType.defaultUser;
      autoAssigned = true;
      defaultUserUsed = true;
      assignmentReason = `Usuario por defecto para tipo de ticket '${ticketType.name}'`;
    } else {
      // Buscar usuarios que puedan dar soporte a este tipo de ticket
      const supportUsers = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin(
          'user.supportTypes',
          'supportType',
          'supportType.id = :ticketTypeId',
          {
            ticketTypeId: createCompleteTicketDto.ticketTypeId,
          },
        )
        .where('user.active = :active', { active: true })
        .getMany();

      if (supportUsers.length > 0) {
        // Usar el primer usuario disponible con capacidad de soporte
        assignedUser = supportUsers[0];
        autoAssigned = true;
        assignmentReason = `Usuario con especialización en '${ticketType.name}'`;
      } else {
        // Como último recurso, asignar al creador del ticket
        assignedUser = creator;
        autoAssigned = true;
        assignmentReason =
          'Asignado al creador del ticket (no hay especialistas disponibles)';
      }
    }

    // 4. Generar número de ticket único
    const ticketNumber = await this.generateTicketNumber(
      createCompleteTicketDto.ticketTypeId,
    );

    // 5. Crear el ticket principal
    const ticketData: Partial<Ticket> = {
      title: createCompleteTicketDto.title,
      description: createCompleteTicketDto.description,
      ticketNumber,
      ticketTypeId: createCompleteTicketDto.ticketTypeId,
      createdBy: createCompleteTicketDto.createdByUserId,
      assignedTo: assignedUser?.id,
      departmentId:
        createCompleteTicketDto.departmentId ||
        creator.departmentId ||
        assignedUser?.departmentId,
      priority: createCompleteTicketDto.priority || TicketPriority.MEDIUM,
      dueDate: createCompleteTicketDto.dueDate
        ? new Date(createCompleteTicketDto.dueDate)
        : undefined,
      estimatedHours: createCompleteTicketDto.estimatedHours,
      tags: createCompleteTicketDto.tags || [],
      isUrgent: createCompleteTicketDto.isUrgent || false,
      isInternal: createCompleteTicketDto.isInternal || false,
      notificationsEnabled:
        createCompleteTicketDto.notificationsEnabled !== undefined
          ? createCompleteTicketDto.notificationsEnabled
          : true,
      customFields: createCompleteTicketDto.customFields || {},
      status: TicketStatus.OPEN,
    };

    const ticket = this.ticketRepository.create(ticketData);
    const savedTicket = await this.ticketRepository.save(ticket);

    // 6. Crear participantes
    const participantsCreated: TicketParticipant[] = [];

    // Agregar creador como participante
    try {
      const creatorParticipant = await this.participantRepository.save(
        this.participantRepository.create({
          ticketId: savedTicket.id,
          userId: createCompleteTicketDto.createdByUserId,
          role: ParticipantRole.CREATOR,
          canEdit: true,
          canComment: true,
          canClose: true,
          canAssign: true,
        }),
      );
      participantsCreated.push(creatorParticipant);
    } catch (error) {
      console.error(
        `Error agregando creador como participante (userId: ${createCompleteTicketDto.createdByUserId}):`,
        error,
      );
      throw new BadRequestException(
        `Error al agregar el usuario creador como participante. Verifique que el usuario con ID ${createCompleteTicketDto.createdByUserId} existe.`,
      );
    }

    // Agregar usuario asignado como participante (si es diferente del creador)
    if (
      assignedUser &&
      assignedUser.id !== createCompleteTicketDto.createdByUserId
    ) {
      try {
        const assigneeParticipant = await this.participantRepository.save(
          this.participantRepository.create({
            ticketId: savedTicket.id,
            userId: assignedUser.id,
            role: ParticipantRole.ASSIGNEE,
            canEdit: true,
            canComment: true,
            canClose: true,
            canAssign: false,
          }),
        );
        participantsCreated.push(assigneeParticipant);
      } catch (error) {
        console.error(
          `Error agregando usuario asignado como participante (userId: ${assignedUser.id}):`,
          error,
        );
        throw new BadRequestException(
          `Error al agregar el usuario asignado como participante. Verifique que el usuario con ID ${assignedUser.id} existe.`,
        );
      }
    }

    // Agregar participantes adicionales especificados
    if (createCompleteTicketDto.participants?.length) {
      for (const participantDto of createCompleteTicketDto.participants) {
        // Verificar que el usuario existe
        const participantUser = await this.userRepository.findOne({
          where: { id: participantDto.userId },
        });
        if (!participantUser) {
          console.warn(
            `Usuario participante con ID ${participantDto.userId} no encontrado, se omite`,
          );
          throw new NotFoundException(
            `Usuario participante con ID ${participantDto.userId} no encontrado`,
          );
        }

        // Evitar duplicados
        const existingParticipant = participantsCreated.find(
          (p) => p.userId === participantDto.userId,
        );
        if (existingParticipant) {
          console.warn(
            `Usuario ${participantDto.userId} ya es participante, se omite`,
          );
          continue;
        }

        try {
          const participant = await this.participantRepository.save(
            this.participantRepository.create({
              ticketId: savedTicket.id,
              userId: participantDto.userId,
              role: participantDto.role,
              canEdit: participantDto.canEdit || false,
              canComment:
                participantDto.canComment !== undefined
                  ? participantDto.canComment
                  : true,
              canClose: false,
              canAssign: false,
            }),
          );
          participantsCreated.push(participant);
        } catch (error) {
          console.error(
            `Error agregando participante (userId: ${participantDto.userId}):`,
            error,
          );
          throw new BadRequestException(
            `Error al agregar participante con ID ${participantDto.userId}. Verifique que el usuario existe.`,
          );
        }
      }
    }

    // 7. Crear mensaje inicial si se proporciona
    let initialMessage: TicketMessage | null = null;
    if (createCompleteTicketDto.initialMessage) {
      initialMessage = await this.messageRepository.save(
        this.messageRepository.create({
          ticketId: savedTicket.id,
          senderId: createCompleteTicketDto.createdByUserId,
          content: createCompleteTicketDto.initialMessage,
          type: MessageType.COMMENT,
          isInternal: createCompleteTicketDto.isInternal || false,
        }),
      );
    }

    // 8. Procesar archivos adjuntos
    const attachmentsCreated: TicketAttachment[] = [];
    if (createCompleteTicketDto.attachments?.length) {
      for (const attachmentDto of createCompleteTicketDto.attachments) {
        const attachment = await this.attachmentRepository.save(
          this.attachmentRepository.create({
            ticketId: savedTicket.id,
            messageId: initialMessage?.id,
            uploadedById: createCompleteTicketDto.createdByUserId,
            fileName: attachmentDto.fileName,
            originalFileName: attachmentDto.originalFileName,
            filePath: attachmentDto.filePath,
            oneDriveFileId: (attachmentDto as any).oneDriveFileId || null,
            mimeType: attachmentDto.mimeType,
            fileSize: attachmentDto.fileSize,
            description: attachmentDto.description,
            // oneDriveFileId: attachmentDto.oneDriveFileId,
          }),
        );
        attachmentsCreated.push(attachment);
      }
    }

    // 9. Crear registros de historial
    await this.createHistoryRecord(
      savedTicket.id,
      createCompleteTicketDto.createdByUserId,
      HistoryAction.CREATED,
      null,
      {
        ticketNumber: savedTicket.ticketNumber,
        title: savedTicket.title,
        assignedTo: assignedUser?.id,
        assignmentReason,
        autoAssigned,
      },
    );

    if (autoAssigned && assignedUser) {
      await this.createHistoryRecord(
        savedTicket.id,
        createCompleteTicketDto.createdByUserId,
        HistoryAction.ASSIGNED,
        null,
        {
          assignedTo: assignedUser.id,
          assignedToName: `${assignedUser.firstName} ${assignedUser.lastName}`,
          reason: assignmentReason,
          automatic: true,
        },
      );
    }

    // 10. Crear mensaje del sistema
    await this.createSystemMessage(
      savedTicket.id,
      createCompleteTicketDto.createdByUserId,
      `Ticket ${savedTicket.ticketNumber} creado${autoAssigned ? ' y asignado automáticamente' : ''}`,
      {
        action: 'ticket_created',
        autoAssigned,
        assignedTo: assignedUser?.id,
        attachmentsCount: attachmentsCreated.length,
        participantsCount: participantsCreated.length,
      },
    );

    // 11. Obtener el ticket completo con todas las relaciones
    const completeTicket = await this.findOne(
      savedTicket.id,
      createCompleteTicketDto.createdByUserId,
    );

    // 12. Preparar respuesta
    const response: CompleteTicketResponseDto = {
      ticket: completeTicket,
      assignedUser: assignedUser
        ? {
            id: assignedUser.id,
            firstName: assignedUser.firstName,
            lastName: assignedUser.lastName,
            email: assignedUser.email,
          }
        : null,
      initialMessage,
      attachments: attachmentsCreated,
      participants: participantsCreated,
      ticketNumber: savedTicket.ticketNumber,
      processingInfo: {
        autoAssigned,
        assignmentReason,
        defaultUserUsed,
      },
    };

    // 13. Enviar notificaciones por email (de forma asíncrona para no bloquear la respuesta)
    this.sendTicketCreationNotifications(
      completeTicket,
      creator,
      attachmentsCreated,
    ).catch((error) => {
      console.error(
        'Error enviando notificaciones de creación de ticket:',
        error,
      );
    });

    return response;
  }

  /**
   * Crear un ticket completo con archivos adjuntos desde FormData
   */
  async createCompleteTicketWithFiles(
    createCompleteTicketDto: CreateCompleteTicketDto,
    files: any[] = [],
  ): Promise<CompleteTicketResponseDto> {
    try {
      // --- OneDrive integration for ticket attachments ---
      if (files && files.length > 0) {
        const attachments: any[] = [];
        const userEmail = process.env.ONEDRIVE_USER_EMAIL || '';
        if (!userEmail)
          throw new BadRequestException('No se configuró ONEDRIVE_USER_EMAIL');
        // 1. Buscar userId
        const userRes = await this.graphService.getUserByEmail(userEmail);
        console.log('User OneDrive encontrado:', userRes);
        const userId =
          userRes.value && userRes.value.length > 0
            ? userRes.value[0].id
            : null;
        if (!userId)
          throw new BadRequestException(
            'No se encontró el usuario de OneDrive',
          );

        // Determinar el nombre de carpeta del ticket. Si createCompleteTicketDto tiene ticketNumber
        // (por ejemplo una cadena como 'SOP-2025-0011'), úsalo; si no, usar timestamp temporal.
        const ticketFolderName =
          ((createCompleteTicketDto as any)?.ticketNumber && String((createCompleteTicketDto as any).ticketNumber).trim()) ||
          `ticket_${Date.now()}`;

        for (const file of files) {
          const ext = file.originalname
            ? file.originalname.split('.').pop()
            : 'dat';
          // Usa el nombre original del archivo si lo deseas, o genera uno único:
          // const fileName = file.originalname;
          const fileName = `attachment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
          // Subir archivo a FilesConectaCCI/Tickets/{ticketFolderName}/fileName
          const uploadRes = await this.graphService.uploadToModule(
            userId,
            'Tickets',
            fileName,
            file.buffer,
            ticketFolderName,
          );
          console.log('Archivo subido a OneDrive:', uploadRes);
          // Obtener link de vista previa
          const previewRes = await this.graphService.getFilePreview(
            userId,
            uploadRes.id,
          );
          
          attachments.push({
            fileName: fileName,
            originalFileName: file.originalname,
            filePath: previewRes?.link?.webUrl || '',
            oneDriveFileId: uploadRes?.id || null,
            mimeType: file.mimetype,
            fileSize: file.size,
            description: `Archivo adjunto: ${file.originalname}`,
            // oneDriveFileId: uploadRes.id,
          });
        }
        createCompleteTicketDto.attachments = attachments;
      }
      // Llamar al método original
      return await this.createCompleteTicket(createCompleteTicketDto);
    } catch (error) {
      console.error('Error creando ticket con archivos (OneDrive):', error);
      throw error;
    }
  }

  /**
   * Enviar notificaciones por email para la creación de tickets
   */
  private async sendTicketCreationNotifications(
    ticket: Ticket,
    creator: User,
    attachments: TicketAttachment[] = [],
    customMessage?: string,
  ): Promise<void> {
    try {
      // Obtener todos los participantes del ticket
      const participants = await this.participantRepository.find({
        where: { ticketId: ticket.id },
        relations: ['user'],
      });

      // Preparar listas de destinatarios
      const mainRecipients: string[] = [];
      const ccRecipients: string[] = [];

      // Agregar al creador si no está en participantes
      if (!participants.some((p) => p.user.id === creator.id)) {
        mainRecipients.push(creator.email);
      }

      // Agregar participantes según su rol
      participants.forEach((participant) => {
        if (
          participant.role === ParticipantRole.CREATOR ||
          participant.role === ParticipantRole.ASSIGNEE ||
          participant.role === ParticipantRole.APPROVER
        ) {
          mainRecipients.push(participant.user.email);
        } else {
          ccRecipients.push(participant.user.email);
        }
      });

      // Si hay un usuario asignado y no está en la lista, agregarlo
      if (ticket.assignee && !mainRecipients.includes(ticket.assignee.email)) {
        mainRecipients.push(ticket.assignee.email);
      }

      // Eliminar duplicados
      const uniqueMainRecipients = [...new Set(mainRecipients)];
      const uniqueCcRecipients = [...new Set(ccRecipients)];

      // Preparar contexto de notificación
      const notificationContext = {
        ticket,
        action: 'created' as const,
        user: creator,
        attachments,
        customMessage,
        recipients: {
          to: uniqueMainRecipients,
          cc: uniqueCcRecipients.length > 0 ? uniqueCcRecipients : undefined,
        },
      };

      // Enviar notificación
      await this.ticketNotificationService.notifyTicketCreated(
        notificationContext,
      );

      console.log(
        `Notificaciones de creación enviadas para ticket #${ticket.ticketNumber}`,
      );
    } catch (error) {
      console.error('Error enviando notificaciones de creación:', error);
      throw error;
    }
  }

  /**
   * Método de debug para listar usuarios disponibles
   */
  async getAvailableUsers(): Promise<any> {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'firstName', 'lastName', 'email', 'active'],
        where: { active: true },
        order: { id: 'ASC' },
      });

      return {
        totalUsers: users.length,
        users: users.map((user) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          isActive: user.active,
        })),
      };
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return { error: error.message };
    }
  }

  /**
   * Obtener usuarios activos que pueden atender un tipo de ticket específico
   */
  async getUsersByTicketType(
    ticketTypeId: number,
    page = 1,
    limit = 20,
  ): Promise<{ total: number; page: number; limit: number; users: any[] }> {
    try {
      // Verificar que el tipo de ticket existe
      const ticketType = await this.ticketTypeRepository.findOne({
        where: { id: ticketTypeId },
      });
      if (!ticketType) {
        throw new NotFoundException(
          `Tipo de ticket con ID ${ticketTypeId} no encontrado`,
        );
      }

      const query = this.userRepository
        .createQueryBuilder('user')
        .innerJoin(
          'user.supportTypes',
          'supportType',
          'supportType.id = :ticketTypeId',
          { ticketTypeId },
        )
        .where('user.active = :active', { active: true });

      const total = await query.getCount();

      const users = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const mapped = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        departmentId: u.departmentId,
        active: u.active,
      }));

      return { total, page, limit, users: mapped };
    } catch (error) {
      console.error(
        `Error obteniendo usuarios por tipo de ticket ${ticketTypeId}:`,
        error,
      );
      throw error;
    }
  }
}
