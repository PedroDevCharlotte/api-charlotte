function mapUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority } from './Entity/ticket.entity';
import { TicketParticipant, ParticipantRole } from './Entity/ticket-participant.entity';
import { TicketMessage, MessageType } from './Entity/ticket-message.entity';
import { TicketHistory, HistoryAction } from './Entity/ticket-history.entity';
import { TicketAttachment } from './Entity/ticket-attachment.entity';
import { CreateTicketDto, UpdateTicketDto } from './Dto/ticket.dto';
import { GraphService } from '../../Services/EntraID/graph.service';
import { CreateCompleteTicketDto, CompleteTicketResponseDto } from './Dto/create-complete-ticket.dto';
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
  private readonly graphService: GraphService,
  ) {}

  async getAttachmentById(id: number) {
    return this.attachmentRepository.findOne({
      where: { id },
      relations: ['uploadedBy']
    });
  }

  /**
   * Crear un nuevo ticket
   */
  async create(createTicketDto: CreateTicketDto, currentUserId: number): Promise<Ticket> {
    // Verificar que el usuario existe
    const creator = await this.userRepository.findOne({ where: { id: currentUserId } });
    if (!creator) {
      throw new NotFoundException('Usuario creador no encontrado');
    }

    // Generar número de ticket único
    const ticketNumber = await this.generateTicketNumber(createTicketDto.ticketTypeId);

    // Crear el ticket
    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      ticketNumber,
      createdBy: currentUserId,
      dueDate: createTicketDto.dueDate ? new Date(createTicketDto.dueDate) : undefined,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // Agregar participantes iniciales
    await this.addInitialParticipants(savedTicket.id, createTicketDto, currentUserId);

    // Crear registro de historial
    await this.createHistoryRecord(
      savedTicket.id,
      currentUserId,
      HistoryAction.CREATED,
      null,
      { ticketNumber: savedTicket.ticketNumber, title: savedTicket.title }
    );

    // Crear mensaje inicial del sistema
    await this.createSystemMessage(
      savedTicket.id,
      currentUserId,
      `Ticket ${savedTicket.ticketNumber} creado`,
      { action: 'ticket_created' }
    );

    return this.findOne(savedTicket.id, currentUserId);
  }

  /**
   * Obtener todos los tickets con filtros
   */
  async findAll(filters: TicketFilters, currentUserId: number): Promise<{ tickets: any[]; total: number }> {
    const queryBuilder = this.ticketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType')
      .leftJoinAndSelect('ticket.creator', 'creator')
      .leftJoinAndSelect('ticket.assignee', 'assignee')
      .leftJoinAndSelect('ticket.department', 'department')
      .leftJoinAndSelect('ticket.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser');

    // Aplicar filtros
    if (filters.status?.length) {
      queryBuilder.andWhere('ticket.status IN (:...status)', { status: filters.status });
    }

    if (filters.priority?.length) {
      queryBuilder.andWhere('ticket.priority IN (:...priority)', { priority: filters.priority });
    }

    if (filters.assignedTo) {
      queryBuilder.andWhere('ticket.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    if (filters.createdBy) {
      queryBuilder.andWhere('ticket.createdBy = :createdBy', { createdBy: filters.createdBy });
    }

    if (filters.departmentId) {
      queryBuilder.andWhere('ticket.departmentId = :departmentId', { departmentId: filters.departmentId });
    }

    if (filters.ticketTypeId) {
      queryBuilder.andWhere('ticket.ticketTypeId = :ticketTypeId', { ticketTypeId: filters.ticketTypeId });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(ticket.title ILIKE :search OR ticket.description ILIKE :search OR ticket.ticketNumber ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.isUrgent !== undefined) {
      queryBuilder.andWhere('ticket.isUrgent = :isUrgent', { isUrgent: filters.isUrgent });
    }

    if (filters.isInternal !== undefined) {
      queryBuilder.andWhere('ticket.isInternal = :isInternal', { isInternal: filters.isInternal });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('ticket.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('ticket.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    // Filtrado por rol del usuario
    try {
      const currentUser = await this.userRepository.findOne({ where: { id: currentUserId }, relations: ['role', 'subordinates'] });
      const roleName = (currentUser?.role?.name || '').toLowerCase();

      // Administrador: ver todos
      if (roleName.includes('admin') || roleName.includes('administrador')) {
        // no aplicar filtros adicionales
      } else if (roleName.includes('gerente') || roleName.includes('manager') || roleName.includes('jefe')) {
        // Gerente: ver los que genera, los que está asignado y los que sus subordinados están asignados
        const subIds = (currentUser?.subordinates || []).map(s => s.id).filter(Boolean);
        if (subIds.length > 0) {
          queryBuilder.andWhere('(ticket.createdBy = :userId OR ticket.assignedTo = :userId OR ticket.assignedTo IN (:...subIds))', { userId: currentUserId, subIds });
        } else {
          queryBuilder.andWhere('(ticket.createdBy = :userId OR ticket.assignedTo = :userId)', { userId: currentUserId });
        }
      } else if (roleName.includes('tec') || roleName.includes('soporte') || roleName.includes('technician')) {
        // Técnico: ver los creados por él y los que está asignado
        queryBuilder.andWhere('(ticket.createdBy = :userId OR ticket.assignedTo = :userId)', { userId: currentUserId });
      } else {
        // Usuario normal (por defecto): solo tickets que él generó
        queryBuilder.andWhere('ticket.createdBy = :userId', { userId: currentUserId });
      }
    } catch (err) {
      // Fallback: aplicar filtro por participación si hay error al obtener usuario
      queryBuilder.andWhere(
        '(ticket.createdBy = :userId OR ticket.assignedTo = :userId OR participants.userId = :userId)',
        { userId: currentUserId }
      );
    }

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Ordenamiento
    queryBuilder.orderBy('ticket.createdAt', 'DESC');

    const [tickets, total] = await queryBuilder.getManyAndCount();
    const formattedTickets = await Promise.all(tickets.map(async ticket => {
      const messages = await Promise.all((ticket.messages || []).map(msg => this.mapMessage(msg)));
      const attachments = await Promise.all((ticket.attachments || []).map(att => this.mapAttachment(att)));
      return {
        ...ticket,
        creator: mapUser(ticket.creator),
        assignee: mapUser(ticket.assignee),
        participants: ticket.participants?.map(p => ({
          ...p,
          user: mapUser(p.user)
        })),
        messages,
        attachments,
        history: ticket.history?.map(h => ({
          ...h,
          user: mapUser(h.user)
        }))
      };
    }));
    return { tickets: formattedTickets, total };
  }

  /**
   * Obtener un ticket por ID
   */
  async findOne(id: number, currentUserId: number): Promise<any> {
    console.log("Id del usuario", currentUserId);
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) return null;
    const messages = await Promise.all((ticket.messages || []).map(msg => this.mapMessage(msg)));
    const attachments = await Promise.all((ticket.attachments || []).map(att => this.mapAttachment(att)));
    return {
      ...ticket,
      creator: mapUser(ticket.creator),
      assignee: mapUser(ticket.assignee),
      participants: ticket.participants?.map(p => ({
        ...p,
        user: mapUser(p.user)
      })),
      messages,
      attachments,
      history: ticket.history?.map(h => ({
        ...h,
        user: mapUser(h.user)
      }))
    };
  }

  private async mapAttachment(att: any): Promise<any> {
    return {
      ...att,
      uploadedBy: mapUser(att.uploadedBy),
      previewUrl: att.oneDriveFileId
        ? (await this.getAttachmentPreviewUrl(att.oneDriveFileId))
        : att.filePath || null
    };
  }

  private async mapMessage(msg: any): Promise<any> {
    const attachments = await Promise.all((msg.attachments || []).map(att => this.mapAttachment(att)));
    return {
      ...msg,
      sender: mapUser(msg.sender),
      editedByUser: mapUser(msg.editedByUser),
      replyTo: msg.replyTo ? {
        ...msg.replyTo,
        sender: mapUser(msg.replyTo.sender)
      } : null,
      attachments
    };
  }
  /**
   * Obtiene el enlace de vista previa de un archivo adjunto en OneDrive
   */
  private async getAttachmentPreviewUrl(oneDriveFileId: string): Promise<string | null> {
    try {
      const userEmail = process.env.ONEDRIVE_USER_EMAIL || '';
      if (!userEmail) return null;
      const userRes = await this.graphService.getUserByEmail(userEmail);
      const userId = userRes.value && userRes.value.length > 0 ? userRes.value[0].id : null;
      if (!userId) return null;
      const previewRes = await this.graphService.getFilePreview(userId, oneDriveFileId);
      return previewRes?.link?.webUrl || null;
    } catch {
      return null;
    }
  }

  /**
   * Actualizar un ticket
   */
  async update(id: number, updateTicketDto: UpdateTicketDto, currentUserId: number): Promise<Ticket> {
    // Cargar la entidad directamente desde el repositorio (no la versión "mapeada" que devuelve findOne())
    const ticketEntity = await this.ticketRepository.findOne({
      where: { id },
      relations: ['participants', 'participants.user', 'creator', 'assignee', 'department']
    });

    if (!ticketEntity) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }

    // Verificar permisos de acceso y edición
    await this.checkTicketAccess(ticketEntity, currentUserId);
    await this.checkEditPermissions(ticketEntity, currentUserId);

    const oldValues = { ...ticketEntity } as any;

    // Aplicar actualizaciones al entity
    Object.assign(ticketEntity, {
      ...updateTicketDto,
      dueDate: updateTicketDto.dueDate ? new Date(updateTicketDto.dueDate) : ticketEntity.dueDate,
    });

    // Manejar cambios de estado especiales
    if (updateTicketDto.status) {
      await this.handleStatusChange(ticketEntity, oldValues.status, updateTicketDto.status, currentUserId);
    }

    const savedTicket = await this.ticketRepository.save(ticketEntity);

    // Crear registro de historial
    await this.createHistoryRecord(
      id,
      currentUserId,
      HistoryAction.UPDATED,
      this.extractRelevantFields(oldValues),
      this.extractRelevantFields(savedTicket)
    );

    // Enviar notificación de actualización (no bloquear la respuesta)
    try {
      const recipients = await this.buildEmailRecipients(savedTicket.id, currentUserId);
      const actor = (await this.userRepository.findOne({ where: { id: currentUserId } })) || { id: currentUserId, firstName: '', lastName: '', email: '' } as any;
      const ticketForEmail = await this.findOne(savedTicket.id, currentUserId);
      this.ticketNotificationService.notifyTicketUpdated({
        ticket: ticketForEmail,
        action: 'updated',
        user: actor as User,
        previousValues: this.extractRelevantFields(oldValues),
        recipients,
      }).catch(err => {
        console.error('Error enviando notificación de actualización:', err);
      });
    } catch (err) {
      console.error('Error preparando notificación de actualización:', err);
    }

    // Devolver la representación completa y mapeada
    return this.findOne(id, currentUserId);
  }

  /**
   * Asignar ticket a un usuario
   */
  async assignTicket(ticketId: number, assigneeId: number, currentUserId: number): Promise<Ticket> {
    const ticket = await this.findOne(ticketId, currentUserId);
    
    // Verificar permisos
    await this.checkAssignPermissions(ticket, currentUserId);
    // Buscar el nuevo usuario asignado
    const newAssignee = await this.userRepository.findOne({ where: { id: assigneeId } });
    if (!newAssignee) {
      throw new NotFoundException('Usuario asignado no encontrado');
    }
    const oldAssignee = ticket.assignedTo;
    ticket.assignedTo = assigneeId;
    ticket.assignee = newAssignee;

    
    await this.ticketRepository.save(ticket);

    // Agregar como participante si no lo es
    await this.ensureParticipant(ticketId, assigneeId, ParticipantRole.ASSIGNEE, currentUserId);

    // Eliminar al asesor anterior de los participantes relacionados si cambió
    if (oldAssignee && oldAssignee !== assigneeId) {
      try {
        const prevParticipant = await this.participantRepository.findOne({ where: { ticketId, userId: oldAssignee } });
        if (prevParticipant) {
          await this.participantRepository.remove(prevParticipant);
        }
      } catch (err) {
        console.error(`Error eliminando participante anterior (userId: ${oldAssignee}) del ticket ${ticketId}:`, err);
      }
    }

    // Crear mensaje del sistema
    const assignee = await this.userRepository.findOne({ where: { id: assigneeId } });
    if (!assignee) {
      throw new NotFoundException('Usuario asignado no encontrado');
    }
    
    await this.createSystemMessage(
      ticketId,
      currentUserId,
      `Ticket asignado a ${assignee.firstName} ${assignee.lastName}`,
      { action: 'assigned', oldAssignee, newAssignee: assigneeId }
    );

    // Historial
    await this.createHistoryRecord(
      ticketId,
      currentUserId,
      HistoryAction.ASSIGNED,
      { assignedTo: oldAssignee },
      { assignedTo: assigneeId }
    );

    // Enviar notificación de reasignación siempre al nuevo asignado (no bloquear la respuesta)
    try {
      const actor = (await this.userRepository.findOne({ where: { id: currentUserId } })) || { id: currentUserId, firstName: '', lastName: '', email: '' } as any;
      const ticketForEmail = await this.findOne(ticketId, currentUserId);
      const assigneeEmail = assignee.email;
      const recipients = assigneeEmail ? { to: [assigneeEmail] } : { to: [] };
      this.ticketNotificationService.notifyTicketAssigned({
        ticket: ticketForEmail,
        action: 'assigned',
        user: actor as User,
        previousValues: { assignedTo: oldAssignee },
        recipients,
      }).catch(err => {
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
  async closeTicket(ticketId: number, resolution: string, currentUserId: number): Promise<Ticket> {
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

    await this.ticketRepository.save(ticket);

    // Crear mensaje de cierre
    await this.createSystemMessage(
      ticketId,
      currentUserId,
      `Ticket cerrado: ${resolution}`,
      { action: 'closed', resolution }
    );

    // Historial
    await this.createHistoryRecord(
      ticketId,
      currentUserId,
      HistoryAction.CLOSED,
      { status: TicketStatus.COMPLETED },
      { status: TicketStatus.CLOSED, closedAt: ticket.closedAt }
    );

    // Enviar notificación de cierre solo al creador (no bloquear respuesta)
    try {
      const actor = (await this.userRepository.findOne({ where: { id: currentUserId } })) || { id: currentUserId, firstName: '', lastName: '', email: '' } as any;
      const ticketForEmail = await this.findOne(ticketId, currentUserId);
      const creatorEmail = ticketForEmail?.creator?.email;
      const recipients = creatorEmail ? { to: [creatorEmail] } : { to: [] };
      this.ticketNotificationService.notifyTicketClosed({
        ticket: ticketForEmail,
        action: 'closed',
        user: actor as User,
        previousValues: { status: TicketStatus.COMPLETED },
        recipients,
        // include the resolution as customMessage so templates render the closure message
        customMessage: resolution,
      }).catch(err => {
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
      throw new ForbiddenException('No tienes permisos para eliminar este ticket');
    }

    await this.ticketRepository.remove(ticket);

    // Historial
    await this.createHistoryRecord(
      id,
      currentUserId,
      HistoryAction.DELETED,
      this.extractRelevantFields(ticket),
      null
    );
  }

  /**
   * Obtener estadísticas de tickets
   */
  async getStatistics(currentUserId: number): Promise<any> {
    // Aplicar las mismas reglas de visibilidad que en findAll(), pero
    // no usar la pertenencia como participante para incluir tickets.
    const currentUser = await this.userRepository.findOne({ where: { id: currentUserId }, relations: ['role', 'subordinates'] });
    const roleName = (currentUser?.role?.name || '').toLowerCase();

    const applyRoleFilters = (qb: any) => {
      if (roleName.includes('admin') || roleName.includes('administrador')) {
        // administrador: ver todos
        return qb;
      } else if (roleName.includes('gerente') || roleName.includes('manager') || roleName.includes('jefe')) {
        const subIds = (currentUser?.subordinates || []).map((s: any) => s.id).filter(Boolean);
        if (subIds.length > 0) {
          return qb.andWhere('(ticket.createdBy = :userId OR ticket.assignedTo = :userId OR ticket.assignedTo IN (:...subIds))', { userId: currentUserId, subIds });
        }
        return qb.andWhere('(ticket.createdBy = :userId OR ticket.assignedTo = :userId)', { userId: currentUserId });
      } else if (roleName.includes('tec') || roleName.includes('soporte') || roleName.includes('technician')) {
        // técnico: ver los creados por él y los que está asignado
        return qb.andWhere('(ticket.createdBy = :userId OR ticket.assignedTo = :userId)', { userId: currentUserId });
      }
      // Usuario normal (por defecto): solo tickets que él generó
      return qb.andWhere('ticket.createdBy = :userId', { userId: currentUserId });
    };

    // Total y agrupados aplicando reglas de visibilidad (NO se incluye pertenencia como participante)
    const total = await applyRoleFilters(this.ticketRepository.createQueryBuilder('ticket')).getCount();

    const byStatusRaw = await applyRoleFilters(this.ticketRepository.createQueryBuilder('ticket'))
      .select('ticket.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.status')
      .getRawMany();

    const byPriority = await applyRoleFilters(this.ticketRepository.createQueryBuilder('ticket'))
      .select('ticket.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.priority')
      .getRawMany();

    // Contadores específicos: assigned => tickets realmente asignados (respetando subordinates para gerente)
    let assignedQb = this.ticketRepository.createQueryBuilder('ticket');
    if (roleName.includes('gerente') || roleName.includes('manager') || roleName.includes('jefe')) {
      const subIds = (currentUser?.subordinates || []).map((s: any) => s.id).filter(Boolean);
      if (subIds.length > 0) {
        assignedQb = assignedQb.andWhere('(ticket.assignedTo = :userId OR ticket.assignedTo IN (:...subIds))', { userId: currentUserId, subIds });
      } else {
        assignedQb = assignedQb.andWhere('ticket.assignedTo = :userId', { userId: currentUserId });
      }
    } else {
      assignedQb = assignedQb.andWhere('ticket.assignedTo = :userId', { userId: currentUserId });
    }
    const assigned = await assignedQb.getCount();

    // created => tickets creados por el usuario
    const created = await this.ticketRepository.createQueryBuilder('ticket')
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
    const monthlyRaw = await applyRoleFilters(
      this.ticketRepository.createQueryBuilder('ticket')
    )
      .select('ticket.status', 'status')
      .addSelect('ticket.ticketTypeId', 'ticketTypeId')
      .addSelect("DATE_FORMAT(ticket.createdAt, '%Y-%m')", 'ym')
      .addSelect('COUNT(*)', 'count')
      .andWhere('ticket.createdAt >= :oldest', { oldest })
      .groupBy('ticket.status')
      .addGroupBy('ticket.ticketTypeId')
      .addGroupBy("ym")
      .getRawMany();

    // Obtener todos los tipos de ticket para devolver nombres
    const ticketTypes = await this.ticketTypeRepository.find();
    const typeMap = new Map<number, string>();
    for (const t of ticketTypes) typeMap.set((t as any).id, (t as any).name || '');

    // Construir byStatus enriquecido: para cada status, incluir tipos con conteo mensual
    const byStatus: Array<any> = [];

    // Inicializar entries de status a partir de byStatusRaw
    for (const row of byStatusRaw) {
      const status = String(row.status);
      const count = Number(row.count) || 0;
      // Inicializar types para cada status con zeroed months
      const types = [] as Array<{ ticketTypeId: number; ticketTypeName: string; counts: Array<{ month: string; count: number }> }>;
      for (const [id, name] of typeMap.entries()) {
        types.push({ ticketTypeId: id, ticketTypeName: name, counts: months.map(m => ({ month: m, count: 0 })) });
      }
      byStatus.push({ status, count, types });
    }

    // Rellenar por status -> type -> month usando monthlyRaw
    for (const row of monthlyRaw) {
      const status = String(row.status);
      const ticketTypeId = Number(row.ticketTypeId);
      const ym = row.ym;
      const cnt = Number(row.count) || 0;
      const statusEntry = byStatus.find(s => s.status === status);
      if (!statusEntry) {
        // Si no existía (posible), crear uno nuevo con zeros
        const types = [] as Array<{ ticketTypeId: number; ticketTypeName: string; counts: Array<{ month: string; count: number }> }>;
        for (const [id, name] of typeMap.entries()) types.push({ ticketTypeId: id, ticketTypeName: name, counts: months.map(m => ({ month: m, count: 0 })) });
        byStatus.push({ status, count: 0, types });
      }
      const targetStatus = byStatus.find(s => s.status === status)!;
      const typeEntry = targetStatus.types.find((t: any) => t.ticketTypeId === ticketTypeId);
      if (typeEntry) {
        const idx = typeEntry.counts.findIndex((c: any) => c.month === ym);
        if (idx >= 0) typeEntry.counts[idx].count = cnt;
      } else {
        // agregar nuevo typeEntry si no estaba en map
        targetStatus.types.push({ ticketTypeId, ticketTypeName: typeMap.get(ticketTypeId) || '', counts: months.map(m => ({ month: m, count: m === ym ? cnt : 0 })) });
      }
    }

    return {
      total,
      assigned,
      created,
      byStatus,
      byPriority,
      months // incluir meses de referencia en la respuesta
    };
  }

  // Métodos auxiliares privados

  private async generateTicketNumber(ticketTypeId: number): Promise<string> {
    // Obtener el tipo de ticket para conseguir el código
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { id: ticketTypeId }
    });

    if (!ticketType) {
      throw new NotFoundException('Tipo de ticket no encontrado');
    }

    const code = ticketType.code || 'TKT'; // Usar 'TKT' como fallback si no hay código
    const year = new Date().getFullYear();
    
    // Obtener el último ticket del mismo tipo para generar el consecutivo
    const lastTicket = await this.ticketRepository.findOne({
      where: { ticketTypeId },
      order: { id: 'DESC' }
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

  private async addInitialParticipants(ticketId: number, createDto: CreateTicketDto, currentUserId: number): Promise<void> {
    // Agregar creador como participante
    await this.ensureParticipant(ticketId, currentUserId, ParticipantRole.CREATOR, currentUserId);

    // Agregar asignado si se especifica
    if (createDto.assignedTo) {
      await this.ensureParticipant(ticketId, createDto.assignedTo, ParticipantRole.ASSIGNEE, currentUserId);
    }

    // Agregar participantes adicionales
    if (createDto.participantIds?.length) {
      for (const participantId of createDto.participantIds) {
        await this.ensureParticipant(ticketId, participantId, ParticipantRole.COLLABORATOR, currentUserId);
      }
    }
  }

  private async ensureParticipant(ticketId: number, userId: number, role: ParticipantRole, addedBy: number): Promise<void> {
    const existing = await this.participantRepository.findOne({
      where: { ticketId, userId }
    });

    if (!existing) {
      const participant = this.participantRepository.create({
        ticketId,
        userId,
        role, 
        addedBy
      });
      await this.participantRepository.save(participant);
    }
  } 

  private async createSystemMessage(ticketId: number, userId: number, content: string, metadata?: any): Promise<void> {
    const message = this.messageRepository.create({
      ticketId,
      senderId: userId,
      content,
      type: MessageType.SYSTEM,
      metadata,
      isInternal: true
    });
    await this.messageRepository.save(message);
  }

  private async createHistoryRecord(
    ticketId: number,
    userId: number,
    action: HistoryAction,
    oldValues: any,
    newValues: any
  ): Promise<void> {
    const history = this.historyRepository.create({
      ticketId,
      userId,
      action,
      oldValues,
      newValues
    });
    await this.historyRepository.save(history);
  }

  private async checkTicketAccess(ticket: Ticket, userId: number): Promise<void> {
    const isParticipant = ticket.participants?.some(p => p.userId === userId);
    const isCreator = ticket.createdBy === userId;
    const isAssignee = ticket.assignedTo === userId;

    if (!isParticipant && !isCreator && !isAssignee) {
      throw new ForbiddenException('No tienes acceso a este ticket');
    }
  }

  private async checkEditPermissions(ticket: Ticket, userId: number): Promise<void> {
    const participant = ticket.participants?.find(p => p.userId === userId);
    const isCreator = ticket.createdBy === userId;
    const canEdit = participant?.canEdit || isCreator;

    if (!canEdit) {
      throw new ForbiddenException('No tienes permisos para editar este ticket');
    }
  }

  private async checkAssignPermissions(ticket: Ticket, userId: number): Promise<void> {
    const participant = ticket.participants?.find(p => p.userId === userId);
    const isCreator = ticket.createdBy === userId;
    const canAssign = participant?.canAssign || isCreator;

    if (!canAssign) {
      throw new ForbiddenException('No tienes permisos para asignar este ticket');
    }
  }

  private async checkClosePermissions(ticket: Ticket, userId: number): Promise<void> {
    const participant = ticket.participants?.find(p => p.userId === userId);
    const isCreator = ticket.createdBy === userId;
    const isAssignee = ticket.assignedTo === userId;
    const canClose = participant?.canClose || isCreator || isAssignee;

    if (!canClose) {
      throw new ForbiddenException('No tienes permisos para cerrar este ticket');
    }
  }

  private async handleStatusChange(ticket: Ticket, oldStatus: TicketStatus, newStatus: TicketStatus, userId: number): Promise<void> {
    if (newStatus === TicketStatus.COMPLETED && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }

    if (newStatus === TicketStatus.CLOSED && !ticket.closedAt) {
      ticket.closedAt = new Date();
    }

    // Crear mensaje del sistema para cambio de estado
    await this.createSystemMessage(
      ticket.id,
      userId,
      `Estado cambiado de ${oldStatus} a ${newStatus}`,
      { action: 'status_changed', oldStatus, newStatus }
    );

    // Notificar por correo a participantes, asignado y creador (excluyendo al actor)
    try {
      const recipients = await this.buildEmailRecipients(ticket.id, userId);
  const actor = (await this.userRepository.findOne({ where: { id: userId } })) || { id: userId, firstName: '', lastName: '', email: '' } as any;
      const ticketForEmail = await this.findOne(ticket.id, userId);
      // Enviar notificación de cambio de estado (no bloquear flujo)
      this.ticketNotificationService.notifyTicketStatusChanged({
        ticket: ticketForEmail,
        action: 'status_changed',
        user: actor as User,
        previousValues: { status: oldStatus },
        recipients,
      }).catch(err => {
        console.error('Error enviando notificación de cambio de estado:', err);
      });
    } catch (err) {
      console.error('Error preparando notificación de cambio de estado:', err);
    }
  }

  /**
   * Construir lista de destinatarios de email para un ticket, excluyendo opcionalmente al actor
   */
  async buildEmailRecipients(ticketId: number, actorId?: number): Promise<{ to: string[]; cc?: string[] }> {
    // Obtener ticket con creador y asignado
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId }, relations: ['creator', 'assignee'] });
    if (!ticket) throw new NotFoundException(`Ticket con ID ${ticketId} no encontrado`);

    // Obtener participantes
    const participants = await this.participantRepository.find({ where: { ticketId }, relations: ['user'] });

    // Build participant emails excluding creator and assignee (they are actors)
    const participantEmails: string[] = [];
    for (const p of participants) {
      if (p.user && p.user.email) {
        const email = (p.user.email || '').toString().trim();
        if (email && email !== ticket.creator?.email && email !== ticket.assignee?.email) participantEmails.push(email);
      }
    }

    // Build primary 'to' - prefer assignee, otherwise creator
    const to: string[] = [];
    if (ticket.assignee && ticket.assignee.email) to.push(ticket.assignee.email.trim());
    else if (ticket.creator && ticket.creator.email) to.push(ticket.creator.email.trim());

    // Build cc from participants (deduplicated)
    const isValidEmail = (e: string) => typeof e === 'string' && /.+@.+\..+/.test(e.trim());
    const cc = Array.from(new Set(participantEmails.map(e => e.toString().trim()).filter(isValidEmail)));

    // Excluir actor si aplica
    if (actorId) {
      const actor = await this.userRepository.findOne({ where: { id: actorId } });
      if (actor && actor.email) {
        const actorEmail = actor.email.trim();
        // remove actor from 'to' and 'cc'
        for (let i = to.length - 1; i >= 0; i--) if (to[i] === actorEmail) to.splice(i, 1);
        for (let i = cc.length - 1; i >= 0; i--) if (cc[i] === actorEmail) cc.splice(i, 1);
      }
    }

    return { to: Array.from(new Set(to)), cc: cc.length ? cc : undefined };
  }

  private extractRelevantFields(ticket: any): any {
    const { id, ticketNumber, title, description, status, priority, assignedTo, departmentId, ...rest } = ticket;
    return { id, ticketNumber, title, description, status, priority, assignedTo, departmentId };
  }

  /**
   * Crear un ticket completo con todas las funcionalidades integradas
   */
  async createCompleteTicket(createCompleteTicketDto: CreateCompleteTicketDto): Promise<CompleteTicketResponseDto> {
    // 1. Validar que el usuario que crea el ticket existe
    const creator = await this.userRepository.findOne({ 
      where: { id: createCompleteTicketDto.createdByUserId },
      relations: ['department', 'role']
    });
    if (!creator) {
      throw new NotFoundException(`Usuario con ID ${createCompleteTicketDto.createdByUserId} no encontrado`);
    }

    // 2. Validar que el tipo de ticket existe y obtener el usuario por defecto
    const ticketType = await this.ticketTypeRepository.findOne({
      where: { id: createCompleteTicketDto.ticketTypeId },
      relations: ['defaultUser']
    });
    if (!ticketType) {
      throw new NotFoundException(`Tipo de ticket con ID ${createCompleteTicketDto.ticketTypeId} no encontrado`);
    }

    // 3. Determinar el usuario asignado
    let assignedUser: User | null = null;
    let autoAssigned = false;
    let assignmentReason = '';
    let defaultUserUsed = false;

    if (createCompleteTicketDto.assignedTo) {
      // Usuario específico asignado manualmente
      assignedUser = await this.userRepository.findOne({
        where: { id: createCompleteTicketDto.assignedTo }
      });
      if (!assignedUser) {
        throw new NotFoundException(`Usuario asignado con ID ${createCompleteTicketDto.assignedTo} no encontrado`);
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
      const supportUsers = await this.userRepository.createQueryBuilder('user')
        .innerJoin('user.supportTypes', 'supportType', 'supportType.id = :ticketTypeId', { 
          ticketTypeId: createCompleteTicketDto.ticketTypeId 
        })
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
        assignmentReason = 'Asignado al creador del ticket (no hay especialistas disponibles)';
      }
    }

    // 4. Generar número de ticket único
    const ticketNumber = await this.generateTicketNumber(createCompleteTicketDto.ticketTypeId);

    // 5. Crear el ticket principal
    const ticketData: Partial<Ticket> = {
      title: createCompleteTicketDto.title,
      description: createCompleteTicketDto.description,
      ticketNumber,
      ticketTypeId: createCompleteTicketDto.ticketTypeId,
      createdBy: createCompleteTicketDto.createdByUserId,
      assignedTo: assignedUser?.id,
      departmentId: createCompleteTicketDto.departmentId || creator.departmentId || assignedUser?.departmentId,
      priority: createCompleteTicketDto.priority || TicketPriority.MEDIUM,
      dueDate: createCompleteTicketDto.dueDate ? new Date(createCompleteTicketDto.dueDate) : undefined,
      estimatedHours: createCompleteTicketDto.estimatedHours,
      tags: createCompleteTicketDto.tags || [],
      isUrgent: createCompleteTicketDto.isUrgent || false,
      isInternal: createCompleteTicketDto.isInternal || false,
      notificationsEnabled: createCompleteTicketDto.notificationsEnabled !== undefined ? createCompleteTicketDto.notificationsEnabled : true,
      customFields: createCompleteTicketDto.customFields || {},
      status: TicketStatus.OPEN
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
          canAssign: true
        })
      );
      participantsCreated.push(creatorParticipant);
    } catch (error) {
      console.error(`Error agregando creador como participante (userId: ${createCompleteTicketDto.createdByUserId}):`, error);
      throw new BadRequestException(`Error al agregar el usuario creador como participante. Verifique que el usuario con ID ${createCompleteTicketDto.createdByUserId} existe.`);
    }

    // Agregar usuario asignado como participante (si es diferente del creador)
    if (assignedUser && assignedUser.id !== createCompleteTicketDto.createdByUserId) {
      try {
        const assigneeParticipant = await this.participantRepository.save(
          this.participantRepository.create({
            ticketId: savedTicket.id,
            userId: assignedUser.id,
            role: ParticipantRole.ASSIGNEE,
            canEdit: true,
            canComment: true,
            canClose: true,
            canAssign: false
          })
        );
        participantsCreated.push(assigneeParticipant);
      } catch (error) {
        console.error(`Error agregando usuario asignado como participante (userId: ${assignedUser.id}):`, error);
        throw new BadRequestException(`Error al agregar el usuario asignado como participante. Verifique que el usuario con ID ${assignedUser.id} existe.`);
      }
    }

    // Agregar participantes adicionales especificados
    if (createCompleteTicketDto.participants?.length) {
      for (const participantDto of createCompleteTicketDto.participants) {
        // Verificar que el usuario existe
        const participantUser = await this.userRepository.findOne({
          where: { id: participantDto.userId }
        });
        if (!participantUser) {
          console.warn(`Usuario participante con ID ${participantDto.userId} no encontrado, se omite`);
          throw new NotFoundException(`Usuario participante con ID ${participantDto.userId} no encontrado`);
        }

        // Evitar duplicados
        const existingParticipant = participantsCreated.find(p => p.userId === participantDto.userId);
        if (existingParticipant) {
          console.warn(`Usuario ${participantDto.userId} ya es participante, se omite`);
          continue;
        }

        try {
          const participant = await this.participantRepository.save(
            this.participantRepository.create({
              ticketId: savedTicket.id,
              userId: participantDto.userId,
              role: participantDto.role,
              canEdit: participantDto.canEdit || false,
              canComment: participantDto.canComment !== undefined ? participantDto.canComment : true,
              canClose: false,
              canAssign: false
            })
          );
          participantsCreated.push(participant);
        } catch (error) {
          console.error(`Error agregando participante (userId: ${participantDto.userId}):`, error);
          throw new BadRequestException(`Error al agregar participante con ID ${participantDto.userId}. Verifique que el usuario existe.`);
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
          isInternal: createCompleteTicketDto.isInternal || false
        })
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
            mimeType: attachmentDto.mimeType,
            fileSize: attachmentDto.fileSize,
            description: attachmentDto.description
          })
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
        autoAssigned
      }
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
          automatic: true
        }
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
        participantsCount: participantsCreated.length
      }
    );

    // 11. Obtener el ticket completo con todas las relaciones
    const completeTicket = await this.findOne(savedTicket.id, createCompleteTicketDto.createdByUserId);

    // 12. Preparar respuesta
    const response: CompleteTicketResponseDto = {
      ticket: completeTicket,
      assignedUser: assignedUser ? {
        id: assignedUser.id,
        firstName: assignedUser.firstName,
        lastName: assignedUser.lastName,
        email: assignedUser.email
      } : null,
      initialMessage,
      attachments: attachmentsCreated,
      participants: participantsCreated,
      ticketNumber: savedTicket.ticketNumber,
      processingInfo: {
        autoAssigned,
        assignmentReason,
        defaultUserUsed
      }
    };

    // 13. Enviar notificaciones por email (de forma asíncrona para no bloquear la respuesta)
    this.sendTicketCreationNotifications(completeTicket, creator, attachmentsCreated)
      .catch(error => {
        console.error('Error enviando notificaciones de creación de ticket:', error);
      });

    return response;
  }

  /**
   * Crear un ticket completo con archivos adjuntos desde FormData
   */
  async createCompleteTicketWithFiles(
    createCompleteTicketDto: CreateCompleteTicketDto,
    files: any[] = []
  ): Promise<CompleteTicketResponseDto> {
    try {
      // --- OneDrive integration for ticket attachments ---
      if (files && files.length > 0) {
        const attachments: any[] = [];
        const userEmail = process.env.ONEDRIVE_USER_EMAIL || '';
        if (!userEmail) throw new BadRequestException('No se configuró ONEDRIVE_USER_EMAIL');
        const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || 'FilesConectaCCI';
        // 1. Buscar userId
        const userRes = await this.graphService.getUserByEmail(userEmail);
        const userId = userRes.value && userRes.value.length > 0 ? userRes.value[0].id : null;
        if (!userId) throw new BadRequestException('No se encontró el usuario de OneDrive');
        // 2. Validar/crear carpeta raíz
        let folder = await this.graphService.validateFolder(userId, rootFolder);
        if (!folder) folder = await this.graphService.createFolder(userId, rootFolder);
        // 3. Crear subcarpeta por ticket (usa timestamp temporal, luego se puede actualizar con el ticketId real)
        const ticketFolderName = `ticket_${Date.now()}`;
        let ticketFolder = await this.graphService.validateFolder(userId, `${rootFolder}/${ticketFolderName}`);
        if (!ticketFolder) ticketFolder = await this.graphService.createFolder(userId, `${rootFolder}/${ticketFolderName}`);

        for (const file of files) {
          const ext = file.originalname ? file.originalname.split('.').pop() : 'dat';
          const fileName = `attachment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const filePath = `${rootFolder}/${ticketFolderName}/${fileName}`;
          // Subir archivo a OneDrive
          const uploadRes = await this.graphService.uploadFile(userId, filePath, file.buffer);
          // Obtener link de vista previa
          const previewRes = await this.graphService.getFilePreview(userId, uploadRes.id);
          attachments.push({
            fileName: fileName,
            originalFileName: file.originalname,
            filePath: previewRes?.link?.webUrl || '',
            mimeType: file.mimetype,
            fileSize: file.size,
            description: `Archivo adjunto: ${file.originalname}`
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
    customMessage?: string
  ): Promise<void> {
    try {
      // Obtener todos los participantes del ticket
      const participants = await this.participantRepository.find({
        where: { ticketId: ticket.id },
        relations: ['user']
      });

      // Preparar listas de destinatarios
      const mainRecipients: string[] = [];
      const ccRecipients: string[] = [];

      // Agregar al creador si no está en participantes
      if (!participants.some(p => p.user.id === creator.id)) {
        mainRecipients.push(creator.email);
      }

      // Agregar participantes según su rol
      participants.forEach(participant => {
        if (participant.role === ParticipantRole.CREATOR || 
            participant.role === ParticipantRole.ASSIGNEE ||
            participant.role === ParticipantRole.APPROVER) {
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
          cc: uniqueCcRecipients.length > 0 ? uniqueCcRecipients : undefined
        }
      };

      // Enviar notificación
      await this.ticketNotificationService.notifyTicketCreated(notificationContext);

      console.log(`Notificaciones de creación enviadas para ticket #${ticket.ticketNumber}`);
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
        order: { id: 'ASC' }
      });

      return {
        totalUsers: users.length,
        users: users.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          isActive: user.active
        }))
      };
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return { error: error.message };
    }
  }

  /**
   * Obtener usuarios activos que pueden atender un tipo de ticket específico
   */
  async getUsersByTicketType(ticketTypeId: number, page = 1, limit = 20): Promise<{ total: number; page: number; limit: number; users: any[] }> {
    try {
      // Verificar que el tipo de ticket existe
      const ticketType = await this.ticketTypeRepository.findOne({ where: { id: ticketTypeId } });
      if (!ticketType) {
        throw new NotFoundException(`Tipo de ticket con ID ${ticketTypeId} no encontrado`);
      }

      const query = this.userRepository.createQueryBuilder('user')
        .innerJoin('user.supportTypes', 'supportType', 'supportType.id = :ticketTypeId', { ticketTypeId })
        .where('user.active = :active', { active: true });

      const total = await query.getCount();

      const users = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const mapped = users.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        departmentId: u.departmentId,
        active: u.active
      }));

      return { total, page, limit, users: mapped };
    } catch (error) {
      console.error(`Error obteniendo usuarios por tipo de ticket ${ticketTypeId}:`, error);
      throw error;
    }
  }
}
