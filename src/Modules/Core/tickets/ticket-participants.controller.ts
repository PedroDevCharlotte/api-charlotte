import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '../../../Common/Auth/auth.guard';
import { Token } from '../../../Common/Decorators/token.decorator';
import { TicketParticipantsService } from './ticket-participants.service';
import { ParticipantRole } from './Entity/ticket-participant.entity';
import {
  AddParticipantDto,
  UpdateParticipantDto,
  TicketParticipantResponseDto,
} from './Dto/ticket-participant.dto';

@ApiTags('Ticket Participants')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('tickets/:ticketId/participants')
export class TicketParticipantsController {
  constructor(private readonly participantsService: TicketParticipantsService) {}

  @Post()
  @ApiOperation({ summary: 'Agregar un participante a un ticket' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Participante agregado exitosamente',
    type: TicketParticipantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'El usuario ya es participante del ticket',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para agregar participantes',
  })
  async addParticipant(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body(ValidationPipe) addParticipantDto: AddParticipantDto,
    @Token('id') userId: number,
  ): Promise<TicketParticipantResponseDto> {
    // Asegurar que el ticketId del parámetro coincida con el del DTO
    const participantDto = { ...addParticipantDto, ticketId };
    const participant = await this.participantsService.addParticipant(participantDto, userId);
    
    return {
      id: participant.id,
      ticketId: participant.ticketId,
      userId: participant.userId,
      role: participant.role,
      canEdit: participant.canEdit,
      canComment: participant.canComment,
      canAssign: participant.canAssign,
      canClose: participant.canClose,
      receiveNotifications: participant.receiveNotifications,
      addedBy: participant.addedBy,
      joinedAt: participant.joinedAt,
      removedAt: participant.removedAt,
    } as TicketParticipantResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los participantes de un ticket' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participantes obtenidos exitosamente',
    type: [TicketParticipantResponseDto],
  })
  async getParticipants(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Token('id') userId: number,
  ): Promise<TicketParticipantResponseDto[]> {
    const participants = await this.participantsService.findByTicket(ticketId, userId);
    
    return participants.map(participant => ({
      id: participant.id,
      ticketId: participant.ticketId,
      userId: participant.userId,
      role: participant.role,
      canEdit: participant.canEdit,
      canComment: participant.canComment,
      canAssign: participant.canAssign,
      canClose: participant.canClose,
      receiveNotifications: participant.receiveNotifications,
      addedBy: participant.addedBy,
      joinedAt: participant.joinedAt,
      removedAt: participant.removedAt,
    } as TicketParticipantResponseDto));
  }

  @Get(':participantId')
  @ApiOperation({ summary: 'Obtener un participante específico' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiParam({ name: 'participantId', description: 'ID del participante', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participante obtenido exitosamente',
    type: TicketParticipantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Participante no encontrado',
  })
  async getParticipant(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('participantId', ParseIntPipe) participantId: number,
    @Token('id') userId: number,
  ): Promise<TicketParticipantResponseDto> {
    const participant = await this.participantsService.findOne(participantId, userId);
    
    // Verificar que el participante pertenece al ticket correcto
    if (participant.ticketId !== ticketId) {
      throw new Error('El participante no pertenece a este ticket');
    }
    
    return {
      id: participant.id,
      ticketId: participant.ticketId,
      userId: participant.userId,
      role: participant.role,
      canEdit: participant.canEdit,
      canComment: participant.canComment,
      canAssign: participant.canAssign,
      canClose: participant.canClose,
      receiveNotifications: participant.receiveNotifications,
      addedBy: participant.addedBy,
      joinedAt: participant.joinedAt,
      removedAt: participant.removedAt,
    } as TicketParticipantResponseDto;
  }

  @Patch(':participantId')
  @ApiOperation({ summary: 'Actualizar permisos de un participante' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiParam({ name: 'participantId', description: 'ID del participante', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participante actualizado exitosamente',
    type: TicketParticipantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Participante no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para gestionar participantes',
  })
  async updateParticipant(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('participantId', ParseIntPipe) participantId: number,
    @Body(ValidationPipe) updateParticipantDto: UpdateParticipantDto,
    @Token('id') userId: number,
  ): Promise<TicketParticipantResponseDto> {
    const participant = await this.participantsService.updateParticipant(participantId, updateParticipantDto, userId);
    
    return {
      id: participant.id,
      ticketId: participant.ticketId,
      userId: participant.userId,
      role: participant.role,
      canEdit: participant.canEdit,
      canComment: participant.canComment,
      canAssign: participant.canAssign,
      canClose: participant.canClose,
      receiveNotifications: participant.receiveNotifications,
      addedBy: participant.addedBy,
      joinedAt: participant.joinedAt,
      removedAt: participant.removedAt,
    } as TicketParticipantResponseDto;
  }

  @Patch(':participantId/role')
  @ApiOperation({ summary: 'Cambiar el rol de un participante' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiParam({ name: 'participantId', description: 'ID del participante', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rol del participante actualizado exitosamente',
    type: TicketParticipantResponseDto,
  })
  async changeRole(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('participantId', ParseIntPipe) participantId: number,
    @Body('role') newRole: ParticipantRole,
    @Token('id') userId: number,
  ): Promise<TicketParticipantResponseDto> {
    const participant = await this.participantsService.changeRole(participantId, newRole, userId);
    
    return {
      id: participant.id,
      ticketId: participant.ticketId,
      userId: participant.userId,
      role: participant.role,
      canEdit: participant.canEdit,
      canComment: participant.canComment,
      canAssign: participant.canAssign,
      canClose: participant.canClose,
      receiveNotifications: participant.receiveNotifications,
      addedBy: participant.addedBy,
      joinedAt: participant.joinedAt,
      removedAt: participant.removedAt,
    } as TicketParticipantResponseDto;
  }

  @Delete(':participantId')
  @ApiOperation({ summary: 'Remover un participante de un ticket' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiParam({ name: 'participantId', description: 'ID del participante', type: Number })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Participante removido exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Participante no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para remover participantes',
  })
  async removeParticipant(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('participantId', ParseIntPipe) participantId: number,
    @Token('id') userId: number,
  ): Promise<void> {
    await this.participantsService.removeParticipant(participantId, userId);
  }
}

@ApiTags('Participants')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: TicketParticipantsService) {}

  @Get('my-participations')
  @ApiOperation({ summary: 'Obtener mis participaciones en tickets' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participaciones obtenidas exitosamente',
    type: [TicketParticipantResponseDto],
  })
  async getMyParticipations(
    @Token('id') userId: number,
  ): Promise<TicketParticipantResponseDto[]> {
    const participants = await this.participantsService.findByUser(userId, userId);
    
    return participants.map(participant => ({
      id: participant.id,
      ticketId: participant.ticketId,
      userId: participant.userId,
      role: participant.role,
      canEdit: participant.canEdit,
      canComment: participant.canComment,
      canAssign: participant.canAssign,
      canClose: participant.canClose,
      receiveNotifications: participant.receiveNotifications,
      addedBy: participant.addedBy,
      joinedAt: participant.joinedAt,
      removedAt: participant.removedAt,
    } as TicketParticipantResponseDto));
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Obtener estadísticas de mis participaciones' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getMyStats(
    @Token('id') userId: number,
  ) {
    return await this.participantsService.getParticipationStats(userId, userId);
  }

  @Post('transfer-ownership/:ticketId')
  @ApiOperation({ summary: 'Transferir propiedad de un ticket' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Propiedad transferida exitosamente',
  })
  async transferOwnership(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body('newOwnerId', ParseIntPipe) newOwnerId: number,
    @Token('id') userId: number,
  ): Promise<{ success: boolean }> {
    await this.participantsService.transferOwnership(ticketId, newOwnerId, userId);
    return { success: true };
  }
}
