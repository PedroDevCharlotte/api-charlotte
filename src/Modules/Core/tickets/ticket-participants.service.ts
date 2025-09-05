import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketParticipant, ParticipantRole } from './Entity/ticket-participant.entity';
import { TicketStatus } from './Entity/ticket.entity';
import { User } from '../users/Entity/user.entity';
import { AddParticipantDto, UpdateParticipantDto } from './Dto/ticket-participant.dto';
import { TicketsService } from './tickets.service';

@Injectable()
export class TicketParticipantsService {
  constructor(
    @InjectRepository(TicketParticipant)
    private participantRepository: Repository<TicketParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private ticketsService: TicketsService,
  ) {}

  /**
   * Agregar un participante a un ticket
   */
  async addParticipant(addParticipantDto: AddParticipantDto, currentUserId: number): Promise<TicketParticipant> {
    // Verificar acceso al ticket
    const ticket = await this.ticketsService.findOne(addParticipantDto.ticketId, currentUserId);
    
    // Verificar permisos para agregar participantes
    await this.checkAddPermissions(addParticipantDto.ticketId, currentUserId);

    // Verificar que el usuario a agregar existe
    const user = await this.userRepository.findOne({ 
      where: { id: addParticipantDto.userId } 
    });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que no sea ya participante
    const existing = await this.participantRepository.findOne({
      where: { 
        ticketId: addParticipantDto.ticketId, 
        userId: addParticipantDto.userId 
      }
    });

    if (existing) {
      throw new BadRequestException('El usuario ya es participante de este ticket');
    }

    // Crear el participante
    const participant = this.participantRepository.create({
      ...addParticipantDto,
      addedBy: currentUserId,
    });

    const savedParticipant = await this.participantRepository.save(participant);

    return this.findOne(savedParticipant.id, currentUserId);
  }

  /**
   * Obtener todos los participantes de un ticket
   */
  async findByTicket(ticketId: number, currentUserId: number): Promise<TicketParticipant[]> {
    // Verificar acceso al ticket
    await this.ticketsService.findOne(ticketId, currentUserId);

    return await this.participantRepository.find({
      where: { ticketId },
      relations: ['user', 'addedByUser'],
      order: { joinedAt: 'ASC' }
    });
  }

  /**
   * Obtener un participante específico
   */
  async findOne(id: number, currentUserId: number): Promise<TicketParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { id },
      relations: ['user', 'ticket', 'addedByUser'],
    });

    if (!participant) {
      throw new NotFoundException(`Participante con ID ${id} no encontrado`);
    }

    // Verificar acceso al ticket
    await this.ticketsService.findOne(participant.ticketId, currentUserId);

    return participant;
  }

  /**
   * Actualizar permisos de un participante
   */
  async updateParticipant(id: number, updateParticipantDto: UpdateParticipantDto, currentUserId: number): Promise<TicketParticipant> {
    const participant = await this.findOne(id, currentUserId);
    
    // Verificar permisos para modificar participantes
    await this.checkManagePermissions(participant.ticketId, currentUserId);

    // No se puede cambiar el rol del creador
    if (participant.role === ParticipantRole.CREATOR && updateParticipantDto.role) {
      throw new BadRequestException('No se puede cambiar el rol del creador del ticket');
    }

    // Actualizar campos permitidos
    Object.assign(participant, updateParticipantDto);

    await this.participantRepository.update({ id: participant.id }, {
      role: participant.role,
      canComment: participant.canComment,
      canEdit: participant.canEdit,
      canClose: participant.canClose,
      canAssign: participant.canAssign,
      receiveNotifications: participant.receiveNotifications,
      addedBy: participant.addedBy,
    });

    return this.findOne(id, currentUserId);
  }

  /**
   * Remover un participante de un ticket
   */
  async removeParticipant(id: number, currentUserId: number): Promise<void> {
    const participant = await this.findOne(id, currentUserId);
    
    // Verificar permisos para remover participantes
    await this.checkManagePermissions(participant.ticketId, currentUserId);

    // No se puede remover al creador del ticket
    if (participant.role === ParticipantRole.CREATOR) {
      throw new BadRequestException('No se puede remover al creador del ticket');
    }

    // No se puede remover al asignado actual
    const ticket = await this.ticketsService.findOne(participant.ticketId, currentUserId);
    if (participant.userId === ticket.assignedTo) {
      throw new BadRequestException('No se puede remover al usuario asignado. Primero reasigna el ticket.');
    }

  await this.participantRepository.delete({ id: participant.id });
  }

  /**
   * Obtener participantes por usuario
   */
  async findByUser(userId: number, currentUserId: number): Promise<TicketParticipant[]> {
    // Solo se puede consultar los propios participantes o ser admin
    if (userId !== currentUserId) {
      // TODO: Verificar si es admin
      throw new ForbiddenException('No puedes consultar los participantes de otro usuario');
    }

    return await this.participantRepository.find({
      where: { userId },
      relations: ['ticket', 'ticket.ticketType', 'addedByUser'],
      order: { joinedAt: 'DESC' }
    });
  }

  /**
   * Cambiar rol de un participante
   */
  async changeRole(id: number, newRole: ParticipantRole, currentUserId: number): Promise<TicketParticipant> {
    const participant = await this.findOne(id, currentUserId);
    
    // Verificar permisos
    await this.checkManagePermissions(participant.ticketId, currentUserId);

    // No se puede cambiar el rol del creador
    if (participant.role === ParticipantRole.CREATOR) {
      throw new BadRequestException('No se puede cambiar el rol del creador del ticket');
    }

    // Validaciones específicas por rol
    if (newRole === ParticipantRole.ASSIGNEE) {
      // Solo puede haber un asignado, actualizar el ticket
      const ticket = await this.ticketsService.findOne(participant.ticketId, currentUserId);
      await this.ticketsService.assignTicket(ticket.id, participant.userId, currentUserId);
    }

    // Actualizar el rol
    participant.role = newRole;
    
    // Ajustar permisos según el nuevo rol
    this.setPermissionsByRole(participant, newRole);

    // Use update(...) to avoid touching relations/FK columns (ticketId)
    await this.participantRepository.update({ id: participant.id }, {
      role: participant.role,
      canEdit: participant.canEdit,
      canComment: participant.canComment,
      canAssign: participant.canAssign,
      canClose: participant.canClose,
      receiveNotifications: participant.receiveNotifications,
      addedBy: participant.addedBy,
    });

    return this.findOne(id, currentUserId);
  }

  /**
   * Obtener estadísticas de participación
   */
  async getParticipationStats(userId: number, currentUserId: number): Promise<any> {
    // Solo se pueden consultar las propias estadísticas o ser admin
    if (userId !== currentUserId) {
      // TODO: Verificar si es admin
      throw new ForbiddenException('No puedes consultar las estadísticas de otro usuario');
    }

    const participations = await this.participantRepository.find({
      where: { userId },
      relations: ['ticket']
    });

    const total = participations.length;
    
    const byRole = participations.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeTickets = participations.filter(p => 
      p.ticket.status !== TicketStatus.CLOSED && p.ticket.status !== TicketStatus.CANCELLED
    ).length;

    const closedTickets = participations.filter(p => 
      p.ticket.status === TicketStatus.CLOSED
    ).length;

    return {
      total,
      activeTickets,
      closedTickets,
      byRole
    };
  }

  /**
   * Transferir ownership de un ticket
   */
  async transferOwnership(ticketId: number, newOwnerId: number, currentUserId: number): Promise<void> {
    // Verificar acceso al ticket
    const ticket = await this.ticketsService.findOne(ticketId, currentUserId);
    
    // Solo el creador actual puede transferir ownership
    if (ticket.createdBy !== currentUserId) {
      throw new ForbiddenException('Solo el creador puede transferir la propiedad del ticket');
    }

    // Verificar que el nuevo owner existe
    const newOwner = await this.userRepository.findOne({ 
      where: { id: newOwnerId } 
    });
    
    if (!newOwner) {
      throw new NotFoundException('Usuario destino no encontrado');
    }

    // Buscar el participante actual del creador
    const currentCreatorParticipant = await this.participantRepository.findOne({
      where: { ticketId, userId: currentUserId, role: ParticipantRole.CREATOR }
    });

    if (currentCreatorParticipant) {
      // Cambiar a colaborador
      currentCreatorParticipant.role = ParticipantRole.COLLABORATOR;
      this.setPermissionsByRole(currentCreatorParticipant, ParticipantRole.COLLABORATOR);
      // Use update to avoid accidental FK changes
      await this.participantRepository.update({ id: currentCreatorParticipant.id }, {
        role: currentCreatorParticipant.role,
        canEdit: currentCreatorParticipant.canEdit,
        canComment: currentCreatorParticipant.canComment,
        canAssign: currentCreatorParticipant.canAssign,
        canClose: currentCreatorParticipant.canClose,
        receiveNotifications: currentCreatorParticipant.receiveNotifications,
        addedBy: currentCreatorParticipant.addedBy,
      });
    }

    // Buscar si el nuevo owner ya es participante
    let newCreatorParticipant = await this.participantRepository.findOne({
      where: { ticketId, userId: newOwnerId }
    });

    if (newCreatorParticipant) {
      // Actualizar a creador
      newCreatorParticipant.role = ParticipantRole.CREATOR;
      this.setPermissionsByRole(newCreatorParticipant, ParticipantRole.CREATOR);
      // Use update to avoid accidental FK changes
      await this.participantRepository.update({ id: newCreatorParticipant.id }, {
        role: newCreatorParticipant.role,
        canEdit: newCreatorParticipant.canEdit,
        canComment: newCreatorParticipant.canComment,
        canAssign: newCreatorParticipant.canAssign,
        canClose: newCreatorParticipant.canClose,
        receiveNotifications: newCreatorParticipant.receiveNotifications,
        addedBy: newCreatorParticipant.addedBy,
      });
    } else {
      // Crear nuevo participante como creador
      newCreatorParticipant = this.participantRepository.create({
        ticketId,
        userId: newOwnerId,
        role: ParticipantRole.CREATOR,
        addedBy: currentUserId,
      });
      this.setPermissionsByRole(newCreatorParticipant, ParticipantRole.CREATOR);
      await this.participantRepository.save(newCreatorParticipant);
    }

    // Actualizar el ticket (esto se debería hacer en el servicio de tickets)
    // pero por simplicidad lo agregamos aquí
    await this.participantRepository.manager.update('Ticket', { id: ticketId }, { createdBy: newOwnerId });
  }

  // Métodos auxiliares privados

  private async checkAddPermissions(ticketId: number, userId: number): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { ticketId, userId }
    });

    if (!participant) {
      throw new ForbiddenException('No eres participante de este ticket');
    }

    // Solo CREATOR y ASSIGNEE pueden agregar participantes
    if (participant.role !== ParticipantRole.CREATOR && participant.role !== ParticipantRole.ASSIGNEE) {
      throw new ForbiddenException('No tienes permisos para agregar participantes');
    }
  }

  private async checkManagePermissions(ticketId: number, userId: number): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { ticketId, userId }
    });

    if (!participant) {
      throw new ForbiddenException('No eres participante de este ticket');
    }

    // Solo CREATOR puede gestionar participantes
    if (participant.role !== ParticipantRole.CREATOR) {
      throw new ForbiddenException('No tienes permisos para gestionar participantes');
    }
  }

  private setPermissionsByRole(participant: TicketParticipant, role: ParticipantRole): void {
    switch (role) {
      case ParticipantRole.CREATOR:
        participant.canEdit = true;
        participant.canComment = true;
        participant.canAssign = true;
        participant.canClose = true;
        break;
        
      case ParticipantRole.ASSIGNEE:
        participant.canEdit = true;
        participant.canComment = true;
        participant.canAssign = false;
        participant.canClose = true;
        break;
        
      case ParticipantRole.COLLABORATOR:
        participant.canEdit = false;
        participant.canComment = true;
        participant.canAssign = false;
        participant.canClose = false;
        break;
        
      case ParticipantRole.OBSERVER:
        participant.canEdit = false;
        participant.canComment = false;
        participant.canAssign = false;
        participant.canClose = false;
        break;
    }
  }
}
