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
import { ListOptionsService } from './list-options.service';
import { 
  CreateListOptionDto, 
  UpdateListOptionDto, 
  ListOptionResponseDto 
} from './Dto/list-option.dto';

@ApiTags('List Options')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('general-lists/:listId/options')
export class ListOptionsController {
  constructor(private readonly listOptionsService: ListOptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva opción en una lista' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Opción creada exitosamente',
    type: ListOptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos o código duplicado',
  })
  async create(
    @Param('listId', ParseIntPipe) listId: number,
    @Body(ValidationPipe) createDto: CreateListOptionDto,
  ): Promise<ListOptionResponseDto> {
    const option = await this.listOptionsService.create(listId, createDto);
    return new ListOptionResponseDto(option);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las opciones de una lista' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Incluir opciones inactivas' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opciones obtenidas exitosamente',
    type: [ListOptionResponseDto],
  })
  async findByList(
    @Param('listId', ParseIntPipe) listId: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ListOptionResponseDto[]> {
    const options = await this.listOptionsService.findByList(
      listId,
      includeInactive === 'true'
    );
    return options.map(option => new ListOptionResponseDto(option));
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar opciones en una lista' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Término de búsqueda' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opciones encontradas exitosamente',
    type: [ListOptionResponseDto],
  })
  async search(
    @Param('listId', ParseIntPipe) listId: number,
    @Query('q') searchTerm: string,
  ): Promise<ListOptionResponseDto[]> {
    const options = await this.listOptionsService.search(listId, searchTerm);
    return options.map(option => new ListOptionResponseDto(option));
  }

  @Get('default')
  @ApiOperation({ summary: 'Obtener la opción por defecto de una lista' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opción por defecto obtenida exitosamente',
    type: ListOptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No hay opción por defecto configurada',
  })
  async getDefault(
    @Param('listId', ParseIntPipe) listId: number,
  ): Promise<ListOptionResponseDto | null> {
    const option = await this.listOptionsService.getDefaultOption(listId);
    return option ? new ListOptionResponseDto(option) : null;
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Obtener una opción por código' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiParam({ name: 'code', description: 'Código de la opción' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opción obtenida exitosamente',
    type: ListOptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Opción no encontrada',
  })
  async findByCode(
    @Param('listId', ParseIntPipe) listId: number,
    @Param('code') code: string,
  ): Promise<ListOptionResponseDto> {
    const option = await this.listOptionsService.findByCode(listId, code);
    return new ListOptionResponseDto(option);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una opción por ID' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiParam({ name: 'id', description: 'ID de la opción', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opción obtenida exitosamente',
    type: ListOptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Opción no encontrada',
  })
  async findOne(
    @Param('listId', ParseIntPipe) listId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ListOptionResponseDto> {
    const option = await this.listOptionsService.findOne(id);
    return new ListOptionResponseDto(option);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Obtener opciones hijas de una opción padre' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiParam({ name: 'id', description: 'ID de la opción padre', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opciones hijas obtenidas exitosamente',
    type: [ListOptionResponseDto],
  })
  async getChildren(
    @Param('listId', ParseIntPipe) listId: number,
    @Param('id', ParseIntPipe) parentOptionId: number,
  ): Promise<ListOptionResponseDto[]> {
    const options = await this.listOptionsService.getChildOptions(parentOptionId);
    return options.map(option => new ListOptionResponseDto(option));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una opción' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiParam({ name: 'id', description: 'ID de la opción', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opción actualizada exitosamente',
    type: ListOptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Opción no encontrada',
  })
  async update(
    @Param('listId', ParseIntPipe) listId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateListOptionDto,
  ): Promise<ListOptionResponseDto> {
    const option = await this.listOptionsService.update(id, updateDto);
    return new ListOptionResponseDto(option);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reordenar opciones de una lista' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opciones reordenadas exitosamente',
  })
  async reorder(
    @Param('listId', ParseIntPipe) listId: number,
    @Body('optionIds') optionIds: number[],
  ): Promise<{ message: string }> {
    await this.listOptionsService.reorderOptions(listId, optionIds);
    return { message: 'Opciones reordenadas exitosamente' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una opción' })
  @ApiParam({ name: 'listId', description: 'ID de la lista', type: Number })
  @ApiParam({ name: 'id', description: 'ID de la opción', type: Number })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Opción eliminada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Opción no encontrada',
  })
  async remove(
    @Param('listId', ParseIntPipe) listId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.listOptionsService.remove(id);
  }
}
