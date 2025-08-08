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
import { GeneralListsService } from './general-lists.service';
import { 
  CreateGeneralListDto, 
  UpdateGeneralListDto, 
  GeneralListResponseDto 
} from './Dto/general-list.dto';

@ApiTags('General Lists')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('general-lists')
export class GeneralListsController {
  constructor(private readonly generalListsService: GeneralListsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva lista general' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lista creada exitosamente',
    type: GeneralListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos o código duplicado',
  })
  async create(
    @Body(ValidationPipe) createDto: CreateGeneralListDto,
  ): Promise<GeneralListResponseDto> {
    const list = await this.generalListsService.create(createDto);
    return new GeneralListResponseDto(list);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las listas generales' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listas obtenidas exitosamente',
    type: [GeneralListResponseDto],
  })
  @ApiQuery({ name: 'includeOptions', required: false, type: Boolean, description: 'Incluir opciones en la respuesta' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrar por categoría' })
  async findAll(
    @Query('includeOptions') includeOptions?: string,
    @Query('category') category?: string,
  ): Promise<GeneralListResponseDto[]> {
    const lists = await this.generalListsService.findAll(
      includeOptions === 'true',
      category
    );
    return lists.map(list => new GeneralListResponseDto(list));
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obtener todas las categorías disponibles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categorías obtenidas exitosamente',
  })
  async getCategories() {
    // Esto podría venir de la enum ListCategory
    return {
      categories: [
        'STATUS',
        'PRIORITY', 
        'DEPARTMENT',
        'COUNTRY',
        'CURRENCY',
        'TICKET_TYPE',
        'PROJECT_TYPE',
        'CUSTOM'
      ]
    };
  }

  @Get('by-category/:category')
  @ApiOperation({ summary: 'Obtener listas por categoría' })
  @ApiParam({ name: 'category', description: 'Categoría a filtrar' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listas de la categoría obtenidas exitosamente',
    type: [GeneralListResponseDto],
  })
  async findByCategory(
    @Param('category') category: string,
  ): Promise<GeneralListResponseDto[]> {
    const lists = await this.generalListsService.findByCategory(category);
    return lists.map(list => new GeneralListResponseDto(list));
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Obtener una lista por código' })
  @ApiParam({ name: 'code', description: 'Código de la lista' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista obtenida exitosamente',
    type: GeneralListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lista no encontrada',
  })
  async findByCode(
    @Param('code') code: string,
    @Query('includeOptions') includeOptions?: string,
  ): Promise<GeneralListResponseDto> {
    const list = await this.generalListsService.findByCode(
      code,
      includeOptions !== 'false'
    );
    return new GeneralListResponseDto(list);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una lista por ID' })
  @ApiParam({ name: 'id', description: 'ID de la lista', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista obtenida exitosamente',
    type: GeneralListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lista no encontrada',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeOptions') includeOptions?: string,
  ): Promise<GeneralListResponseDto> {
    const list = await this.generalListsService.findOne(
      id,
      includeOptions !== 'false'
    );
    return new GeneralListResponseDto(list);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una lista general' })
  @ApiParam({ name: 'id', description: 'ID de la lista', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista actualizada exitosamente',
    type: GeneralListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lista no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No se puede modificar una lista del sistema',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateGeneralListDto,
  ): Promise<GeneralListResponseDto> {
    const list = await this.generalListsService.update(id, updateDto);
    return new GeneralListResponseDto(list);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una lista general' })
  @ApiParam({ name: 'id', description: 'ID de la lista', type: Number })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Lista eliminada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lista no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No se puede eliminar una lista del sistema',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.generalListsService.remove(id);
  }

  @Get(':id/options')
  @ApiOperation({ summary: 'Obtener opciones de una lista específica' })
  @ApiParam({ name: 'id', description: 'ID de la lista', type: Number })
  @ApiQuery({ name: 'parentOptionId', required: false, type: Number, description: 'ID de la opción padre para listas jerárquicas' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opciones obtenidas exitosamente',
  })
  async getListOptions(
    @Param('id', ParseIntPipe) id: number,
    @Query('parentOptionId') parentOptionId?: number,
  ) {
    const options = await this.generalListsService.getListOptions(id, parentOptionId);
    return { options };
  }

  @Get(':id/options/search')
  @ApiOperation({ summary: 'Buscar opciones en una lista' })
  @ApiParam({ name: 'id', description: 'ID de la lista', type: Number })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Término de búsqueda' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Opciones encontradas exitosamente',
  })
  async searchOptions(
    @Param('id', ParseIntPipe) id: number,
    @Query('q') searchTerm: string,
  ) {
    const options = await this.generalListsService.searchOptions(id, searchTerm);
    return { options };
  }

  @Get('by-entity/:entityName/:entityValue')
  @ApiOperation({ summary: 'Obtener listas relacionadas a una entidad específica' })
  @ApiParam({ name: 'entityName', description: 'Nombre de la entidad (ej: ticket_type, department, user_role)', type: String })
  @ApiParam({ name: 'entityValue', description: 'Valor/código/ID de la entidad específica', type: String })
  @ApiQuery({ name: 'includeOptions', required: false, type: Boolean, description: 'Incluir opciones en la respuesta', example: true })
  @ApiQuery({ name: 'fieldType', required: false, type: String, description: 'Filtrar por tipo de campo (SELECT, MULTISELECT, etc.)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listas relacionadas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        entity: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'ticket_type' },
            value: { type: 'string', example: 'SUPPORT' },
            displayName: { type: 'string', example: 'Tipo de Ticket' }
          }
        },
        relatedLists: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              listId: { type: 'number', example: 1 },
              listCode: { type: 'string', example: 'SUPPORT_INCIDENT_CATEGORY' },
              listName: { type: 'string', example: 'Categoría de incidencia' },
              category: { type: 'string', example: 'TICKET_TYPE_SUPPORT' },
              fieldType: { type: 'string', example: 'SELECT' },
              isRequired: { type: 'boolean', example: false },
              displayOrder: { type: 'number', example: 1 },
              helpText: { type: 'string', example: 'Seleccione el tipo de incidencia' },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    code: { type: 'string', example: 'VPN_INTERNET' },
                    value: { type: 'string', example: 'vpn_internet' },
                    displayText: { type: 'string', example: 'VPN/Internet' },
                    color: { type: 'string', example: '#2196F3' },
                    icon: { type: 'string', example: 'wifi' },
                    displayOrder: { type: 'number', example: 1 }
                  }
                }
              }
            }
          }
        },
        totalCount: { type: 'number', example: 1 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No se encontraron listas para la entidad especificada',
  })
  async getListsByEntity(
    @Param('entityName') entityName: string,
    @Param('entityValue') entityValue: string,
    @Query('includeOptions') includeOptions?: string,
    @Query('fieldType') fieldType?: string,
  ): Promise<any> {
    return await this.generalListsService.getListsByEntity(
      entityName,
      entityValue,
      includeOptions === 'true',
      fieldType
    );
  }

  @Get('by-entity-id/:entityName/:entityId')
  @ApiOperation({ summary: 'Obtener listas relacionadas a una entidad por ID' })
  @ApiParam({ name: 'entityName', description: 'Nombre de la entidad (ej: ticket_type, department)', type: String })
  @ApiParam({ name: 'entityId', description: 'ID numérico de la entidad', type: Number })
  @ApiQuery({ name: 'includeOptions', required: false, type: Boolean, description: 'Incluir opciones en la respuesta', example: true })
  @ApiQuery({ name: 'fieldType', required: false, type: String, description: 'Filtrar por tipo de campo (SELECT, MULTISELECT, etc.)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listas relacionadas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        entity: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'ticket_type' },
            code: { type: 'string', example: 'SUPPORT' },
            displayName: { type: 'string', example: 'Soporte' }
          }
        },
        relatedLists: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              listId: { type: 'number' },
              listCode: { type: 'string' },
              listName: { type: 'string' },
              category: { type: 'string' },
              fieldType: { type: 'string' },
              isRequired: { type: 'boolean' },
              options: { type: 'array' }
            }
          }
        },
        totalCount: { type: 'number' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entidad no encontrada o sin listas relacionadas',
  })
  async getListsByEntityId(
    @Param('entityName') entityName: string,
    @Param('entityId', ParseIntPipe) entityId: number,
    @Query('includeOptions') includeOptions?: string,
    @Query('fieldType') fieldType?: string,
  ): Promise<any> {
    return await this.generalListsService.getListsByEntityId(
      entityName,
      entityId,
      includeOptions === 'true',
      fieldType
    );
  }
}
