import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '../../../Common/Auth/auth.guard';
import { Token } from '../../../Common/Decorators/token.decorator';
import { TicketMessagesService, MessageFilters } from './ticket-messages.service';
import { MessageType } from './Entity/ticket-message.entity';
import {
  CreateTicketMessageDto,
  UpdateTicketMessageDto,
  TicketMessageResponseDto,
  TicketMessageListResponseDto,
} from './Dto/ticket-message.dto';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Ticket Messages')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('tickets/:ticketId/messages')
export class TicketMessagesController {
  constructor(private readonly messagesService: TicketMessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un mensaje en un ticket' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Mensaje creado exitosamente',
    type: TicketMessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para escribir en este ticket',
  })
  async create(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body(ValidationPipe) createMessageDto: CreateTicketMessageDto,
    @Token('id') userId: number,
  ): Promise<TicketMessageResponseDto> {
    // Asegurar que el ticketId del parámetro coincida con el del DTO
    const messageDto = { ...createMessageDto, ticketId };
    const message = await this.messagesService.create(messageDto, userId);
    
    return {
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      isInternal: message.isInternal,
      metadata: message.metadata,
      replyToId: message.replyToId,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    } as TicketMessageResponseDto;
  }

  @Post('with-attachments')
  @ApiOperation({ summary: 'Crear un mensaje con archivos adjuntos y notificación automática' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Mensaje creado exitosamente con archivos adjuntos y notificación',
    type: TicketMessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para escribir en este ticket',
  })
  @ApiBearerAuth('Token')
  @UseInterceptors(AnyFilesInterceptor())
  async createWithAttachments(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() formData: any,
    @UploadedFiles() files: any[],
    @Token('id') userId: number,
  ): Promise<TicketMessageResponseDto> {
    // Construir DTO base
    const createMessageDto: CreateTicketMessageDto = {
      ticketId,
      content: formData.content,
      type: formData.type,
      replyToId: formData.replyToId ? parseInt(formData.replyToId) : undefined,
      isInternal: formData.isInternal === 'true' || formData.isInternal === true,
      metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined,
    };

    // Lógica en el servicio: guardar mensaje, archivos, actualizar participantes y notificar
    const message = await this.messagesService.createWithAttachments(createMessageDto, userId, files);

    return {
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      isInternal: message.isInternal,
      metadata: message.metadata,
      replyToId: message.replyToId,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    } as TicketMessageResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener mensajes de un ticket' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mensajes obtenidos exitosamente',
    type: TicketMessageListResponseDto,
  })
  @ApiQuery({ name: 'type', required: false, enum: MessageType })
  @ApiQuery({ name: 'isInternal', required: false, type: Boolean })
  @ApiQuery({ name: 'senderId', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', required: false, type: Date })
  @ApiQuery({ name: 'dateTo', required: false, type: Date })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Query() query: any,
    @Token('id') userId: number,
  ): Promise<TicketMessageListResponseDto> {
    const filters: MessageFilters = {
      ticketId,
      type: query.type,
      isInternal: query.isInternal !== undefined ? query.isInternal === 'true' : undefined,
      senderId: query.senderId ? Number(query.senderId) : undefined,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 50,
    };

    const result = await this.messagesService.findByTicket(filters, userId);
    
    return {
      messages: result.messages.map(message => ({
        id: message.id,
        ticketId: message.ticketId,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        isInternal: message.isInternal,
        metadata: message.metadata,
        replyToId: message.replyToId,
        createdAt: message.createdAt,
        editedAt: message.editedAt,
      } as TicketMessageResponseDto)),
      total: result.total,
      page: filters.page || 1,
      limit: filters.limit || 20,
    };
  }

  @Get('unread')
  @ApiOperation({ summary: 'Obtener mensajes no leídos de un ticket' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mensajes no leídos obtenidos exitosamente',
    type: [TicketMessageResponseDto],
  })
  async getUnreadMessages(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Token('id') userId: number,
  ): Promise<TicketMessageResponseDto[]> {
    const messages = await this.messagesService.getUnreadMessages(ticketId, userId);
    return messages.map(message => ({
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      isInternal: message.isInternal,
      metadata: message.metadata,
      replyToId: message.replyToId,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    } as TicketMessageResponseDto));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de mensajes de un ticket' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getMessageStats(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Token('id') userId: number,
  ) {
    return await this.messagesService.getMessageStats(ticketId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un mensaje específico' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiParam({ name: 'id', description: 'ID del mensaje', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mensaje obtenido exitosamente',
    type: TicketMessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mensaje no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para ver este mensaje',
  })
  async findOne(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('id', ParseIntPipe) id: number,
    @Token('id') userId: number,
  ): Promise<TicketMessageResponseDto> {
    const message = await this.messagesService.findOne(id, userId);
    
    // Verificar que el mensaje pertenece al ticket correcto
    if (message.ticketId !== ticketId) {
      throw new Error('El mensaje no pertenece a este ticket');
    }
    
    return {
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      isInternal: message.isInternal,
      metadata: message.metadata,
      replyToId: message.replyToId,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    } as TicketMessageResponseDto;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un mensaje' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiParam({ name: 'id', description: 'ID del mensaje', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mensaje actualizado exitosamente',
    type: TicketMessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mensaje no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No puedes editar este mensaje',
  })
  async update(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateMessageDto: UpdateTicketMessageDto,
    @Token('id') userId: number,
  ): Promise<TicketMessageResponseDto> {
    const message = await this.messagesService.update(id, updateMessageDto, userId);
    return {
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      isInternal: message.isInternal,
      metadata: message.metadata,
      replyToId: message.replyToId,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    } as TicketMessageResponseDto;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar mensaje como leído' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiParam({ name: 'id', description: 'ID del mensaje', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mensaje marcado como leído',
  })
  async markAsRead(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('id', ParseIntPipe) id: number,
    @Token('id') userId: number,
  ): Promise<{ success: boolean }> {
    await this.messagesService.markAsRead(id, userId);
    return { success: true };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Marcar todos los mensajes como leídos' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Todos los mensajes marcados como leídos',
  })
  async markAllAsRead(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Token('id') userId: number,
  ): Promise<{ success: boolean }> {
    await this.messagesService.markAllAsRead(ticketId, userId);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un mensaje' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket', type: Number })
  @ApiParam({ name: 'id', description: 'ID del mensaje', type: Number })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Mensaje eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mensaje no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No puedes eliminar este mensaje',
  })
  async remove(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('id', ParseIntPipe) id: number,
    @Token('id') userId: number,
  ): Promise<void> {
    await this.messagesService.remove(id, userId);
  }
}

@ApiTags('Messages')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: TicketMessagesService) {}

  @Patch('mark-multiple-read')
  @ApiOperation({ summary: 'Marcar múltiples mensajes como leídos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mensajes marcados como leídos',
  })
  async markMultipleAsRead(
    @Body('messageIds') messageIds: number[],
    @Token('id') userId: number,
  ): Promise<{ success: boolean }> {
    await this.messagesService.markMultipleAsRead(messageIds, userId);
    return { success: true };
  }
}
