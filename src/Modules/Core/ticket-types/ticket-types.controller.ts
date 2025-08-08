import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { TicketTypesService } from './ticket-types.service';
import { 
  CreateTicketTypeDto, 
  UpdateTicketTypeDto, 
  TicketTypeResponseDto 
} from './Dto/ticket-type.dto';
import { AuthGuard } from '../../../Common/Auth/auth.guard';

@ApiTags('Ticket Types')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tipo de ticket creado exitosamente',
    type: TicketTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un tipo de ticket con este nombre o código',
  })
  async create(@Body() createTicketTypeDto: CreateTicketTypeDto): Promise<TicketTypeResponseDto> {
    return await this.ticketTypesService.create(createTicketTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de ticket' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Incluir tipos de ticket inactivos',
    type: Boolean,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de ticket obtenida exitosamente',
    type: [TicketTypeResponseDto],
  })
  async findAll(@Query('includeInactive') includeInactive?: boolean): Promise<TicketTypeResponseDto[]> {
    if (includeInactive) {
      return await this.ticketTypesService.findAllIncludingInactive();
    }
    return await this.ticketTypesService.findAll();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de tipos de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getStatistics(): Promise<any> {
    return await this.ticketTypesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de ticket por ID' })
  @ApiParam({ name: 'id', description: 'ID del tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de ticket encontrado exitosamente',
    type: TicketTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TicketTypeResponseDto> {
    return await this.ticketTypesService.findOne(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Obtener un tipo de ticket por nombre' })
  @ApiParam({ name: 'name', description: 'Nombre del tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de ticket encontrado exitosamente',
    type: TicketTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  async findByName(@Param('name') name: string): Promise<TicketTypeResponseDto> {
    return await this.ticketTypesService.findByName(name);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Obtener un tipo de ticket por código' })
  @ApiParam({ name: 'code', description: 'Código del tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de ticket encontrado exitosamente',
    type: TicketTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  async findByCode(@Param('code') code: string): Promise<TicketTypeResponseDto> {
    return await this.ticketTypesService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un tipo de ticket' })
  @ApiParam({ name: 'id', description: 'ID del tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de ticket actualizado exitosamente',
    type: TicketTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un tipo de ticket con este nombre o código',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketTypeDto: UpdateTicketTypeDto,
  ): Promise<TicketTypeResponseDto> {
    return await this.ticketTypesService.update(id, updateTicketTypeDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar un tipo de ticket' })
  @ApiParam({ name: 'id', description: 'ID del tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de ticket desactivado exitosamente',
    type: TicketTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<TicketTypeResponseDto> {
    return await this.ticketTypesService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar un tipo de ticket' })
  @ApiParam({ name: 'id', description: 'ID del tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de ticket activado exitosamente',
    type: TicketTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  async activate(@Param('id', ParseIntPipe) id: number): Promise<TicketTypeResponseDto> {
    return await this.ticketTypesService.activate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un tipo de ticket permanentemente' })
  @ApiParam({ name: 'id', description: 'ID del tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de ticket eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'No se puede eliminar el tipo de ticket porque tiene tickets asociados',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.ticketTypesService.remove(id);
    return { message: 'Tipo de ticket eliminado exitosamente' };
  }

  // ========================================
  // ENDPOINTS PARA USUARIO POR DEFECTO
  // ========================================

  @Patch(':id/default-user/:userId')
  @ApiOperation({ summary: 'Asignar usuario por defecto a un tipo de ticket' })
  @ApiParam({ name: 'id', description: 'ID del tipo de ticket' })
  @ApiParam({ name: 'userId', description: 'ID del usuario a asignar como defecto' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario por defecto asignado exitosamente',
    type: TicketTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  async setDefaultUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number
  ): Promise<TicketTypeResponseDto> {
    return await this.ticketTypesService.setDefaultUser(id, userId);
  }

  @Delete(':id/default-user')
  @ApiOperation({ summary: 'Remover usuario por defecto de un tipo de ticket' })
  @ApiParam({ name: 'id', description: 'ID del tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario por defecto removido exitosamente',
    type: TicketTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  async removeDefaultUser(@Param('id', ParseIntPipe) id: number): Promise<TicketTypeResponseDto> {
    return await this.ticketTypesService.setDefaultUser(id, undefined);
  }

  @Get(':id/default-user')
  @ApiOperation({ summary: 'Obtener usuario por defecto de un tipo de ticket' })
  @ApiParam({ name: 'id', description: 'ID del tipo de ticket' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario por defecto obtenido exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de ticket no encontrado',
  })
  async getDefaultUser(@Param('id', ParseIntPipe) id: number) {
    return await this.ticketTypesService.getDefaultUser(id);
  }
}
