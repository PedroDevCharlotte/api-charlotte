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
import { TicketsService, TicketFilters } from './tickets.service';
import { Ticket, TicketStatus, TicketPriority } from './Entity/ticket.entity';
import { CreateTicketDto, UpdateTicketDto, TicketResponseDto, TicketListResponseDto } from './Dto/ticket.dto';
import { CreateCompleteTicketDto, CompleteTicketResponseDto } from './Dto/create-complete-ticket.dto';

interface TicketQueryFilters {
  status?: TicketStatus | TicketStatus[];
  priority?: TicketPriority | TicketPriority[];
  assignedTo?: string;
  createdBy?: string;
  departmentId?: string;
  ticketTypeId?: string;
  search?: string;
  tags?: string[];
  isUrgent?: string;
  isInternal?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
}

@ApiTags('Tickets')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo ticket' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ticket creado exitosamente',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  async create(
    @Body(ValidationPipe) createTicketDto: CreateTicketDto,
    @Token('id') userId: number,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.create(createTicketDto, userId);
    return new TicketResponseDto(ticket);
  }

  @Post('complete')
  @ApiOperation({ 
    summary: 'Crear un ticket completo con asignación automática',
    description: 'Crea un ticket con todas las funcionalidades: asignación automática basada en tipo de soporte, participantes, archivos adjuntos, mensajes iniciales y campos personalizados'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ticket completo creado exitosamente con asignación automática',
    type: CompleteTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario creador o tipo de ticket no encontrado',
  })
  async createComplete(
    @Body(ValidationPipe) createCompleteTicketDto: CreateCompleteTicketDto,
  ): Promise<CompleteTicketResponseDto> {
    return await this.ticketsService.createCompleteTicket(createCompleteTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de tickets con filtros' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tickets obtenida exitosamente',
    type: TicketListResponseDto,
  })
  @ApiQuery({ name: 'status', required: false, isArray: true, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, isArray: true, enum: TicketPriority })
  @ApiQuery({ name: 'assignedTo', required: false, type: Number })
  @ApiQuery({ name: 'createdBy', required: false, type: Number })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'ticketTypeId', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isUrgent', required: false, type: Boolean })
  @ApiQuery({ name: 'isInternal', required: false, type: Boolean })
  @ApiQuery({ name: 'dateFrom', required: false, type: Date })
  @ApiQuery({ name: 'dateTo', required: false, type: Date })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query() filters: TicketQueryFilters,
    @Token('id') userId: number,
  ): Promise<TicketListResponseDto> {
    // Convertir strings de query params a arrays y tipos apropiados
    const processedFilters: TicketFilters = {
      ...filters,
      status: filters.status ? (Array.isArray(filters.status) ? filters.status : [filters.status]) : undefined,
      priority: filters.priority ? (Array.isArray(filters.priority) ? filters.priority : [filters.priority]) : undefined,
      assignedTo: filters.assignedTo ? Number(filters.assignedTo) : undefined,
      createdBy: filters.createdBy ? Number(filters.createdBy) : undefined,
      departmentId: filters.departmentId ? Number(filters.departmentId) : undefined,
      ticketTypeId: filters.ticketTypeId ? Number(filters.ticketTypeId) : undefined,
      page: filters.page ? Number(filters.page) : 1,
      limit: filters.limit ? Number(filters.limit) : 20,
      isUrgent: filters.isUrgent !== undefined ? filters.isUrgent === 'true' : undefined,
      isInternal: filters.isInternal !== undefined ? filters.isInternal === 'true' : undefined,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };

    const result = await this.ticketsService.findAll(processedFilters, userId);
    
    return new TicketListResponseDto(
      result.tickets.map(ticket => new TicketResponseDto(ticket)),
      result.total,
      processedFilters.page || 1,
      processedFilters.limit || 20
    );
  }

  @Get('my-tickets')
  @ApiOperation({ summary: 'Obtener mis tickets (creados o asignados)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mis tickets obtenidos exitosamente',
    type: TicketListResponseDto,
  })
  async getMyTickets(
    @Query() filters: TicketQueryFilters,
    @Token('id') userId: number,
  ): Promise<TicketListResponseDto> {
    // Convertir query filters a TicketFilters y agregar createdBy
    const processedFilters: TicketFilters = {
      status: filters.status ? (Array.isArray(filters.status) ? filters.status : [filters.status]) : undefined,
      priority: filters.priority ? (Array.isArray(filters.priority) ? filters.priority : [filters.priority]) : undefined,
      assignedTo: filters.assignedTo ? Number(filters.assignedTo) : undefined,
      createdBy: userId, // Solo mis tickets
      departmentId: filters.departmentId ? Number(filters.departmentId) : undefined,
      ticketTypeId: filters.ticketTypeId ? Number(filters.ticketTypeId) : undefined,
      search: filters.search,
      page: filters.page ? Number(filters.page) : 1,
      limit: filters.limit ? Number(filters.limit) : 20,
      isUrgent: filters.isUrgent !== undefined ? filters.isUrgent === 'true' : undefined,
      isInternal: filters.isInternal !== undefined ? filters.isInternal === 'true' : undefined,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };

    const result = await this.ticketsService.findAll(processedFilters, userId);
    
    return new TicketListResponseDto(
      result.tickets.map(ticket => new TicketResponseDto(ticket)),
      result.total,
      processedFilters.page || 1,
      processedFilters.limit || 20
    );
  }

  @Get('assigned-to-me')
  @ApiOperation({ summary: 'Obtener tickets asignados a mí' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tickets asignados obtenidos exitosamente',
    type: TicketListResponseDto,
  })
  async getAssignedToMe(
    @Query() filters: TicketQueryFilters,
    @Token('id') userId: number,
  ): Promise<TicketListResponseDto> {
    // Convertir query filters a TicketFilters y agregar assignedTo
    const processedFilters: TicketFilters = {
      status: filters.status ? (Array.isArray(filters.status) ? filters.status : [filters.status]) : undefined,
      priority: filters.priority ? (Array.isArray(filters.priority) ? filters.priority : [filters.priority]) : undefined,
      assignedTo: userId, // Solo tickets asignados a mí
      createdBy: filters.createdBy ? Number(filters.createdBy) : undefined,
      departmentId: filters.departmentId ? Number(filters.departmentId) : undefined,
      ticketTypeId: filters.ticketTypeId ? Number(filters.ticketTypeId) : undefined,
      search: filters.search,
      page: filters.page ? Number(filters.page) : 1,
      limit: filters.limit ? Number(filters.limit) : 20,
      isUrgent: filters.isUrgent !== undefined ? filters.isUrgent === 'true' : undefined,
      isInternal: filters.isInternal !== undefined ? filters.isInternal === 'true' : undefined,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };

    const result = await this.ticketsService.findAll(processedFilters, userId);
    
    return new TicketListResponseDto(
      result.tickets.map(ticket => new TicketResponseDto(ticket)),
      result.total,
      processedFilters.page || 1,
      processedFilters.limit || 20
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de tickets del usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getStatistics(@Token('id') userId: number) {
    return await this.ticketsService.getStatistics(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ticket por ID' })
  @ApiParam({ name: 'id', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket obtenido exitosamente',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para ver este ticket',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Token('id') userId: number,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.findOne(id, userId);
    return new TicketResponseDto(ticket);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un ticket' })
  @ApiParam({ name: 'id', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket actualizado exitosamente',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para editar este ticket',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateTicketDto: UpdateTicketDto,
    @Token('id') userId: number,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.update(id, updateTicketDto, userId);
    return new TicketResponseDto(ticket);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Asignar un ticket a un usuario' })
  @ApiParam({ name: 'id', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket asignado exitosamente',
    type: TicketResponseDto,
  })
  async assignTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body('assigneeId', ParseIntPipe) assigneeId: number,
    @Token('id') userId: number,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.assignTicket(id, assigneeId, userId);
    return new TicketResponseDto(ticket);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Cerrar un ticket' })
  @ApiParam({ name: 'id', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket cerrado exitosamente',
    type: TicketResponseDto,
  })
  async closeTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body('resolution') resolution: string,
    @Token('id') userId: number,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.closeTicket(id, resolution, userId);
    return new TicketResponseDto(ticket);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un ticket' })
  @ApiParam({ name: 'id', description: 'ID del ticket', type: Number })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Ticket eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para eliminar este ticket',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Token('id') userId: number,
  ): Promise<void> {
    await this.ticketsService.remove(id, userId);
  }
}
