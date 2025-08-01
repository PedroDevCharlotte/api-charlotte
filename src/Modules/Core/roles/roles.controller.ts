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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './Dto/role.dto';
import { AuthGuard } from '../../../Common/Auth/auth.guard';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rol creado exitosamente',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un rol con este nombre',
  })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return await this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles activos' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Incluir roles inactivos',
    type: Boolean,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de roles obtenida exitosamente',
    type: [RoleResponseDto],
  })
  async findAll(@Query('includeInactive') includeInactive?: boolean): Promise<RoleResponseDto[]> {
    if (includeInactive) {
      return await this.rolesService.findAllIncludingInactive();
    }
    return await this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol por ID' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rol encontrado exitosamente',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rol no encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleResponseDto> {
    return await this.rolesService.findOne(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Obtener un rol por nombre' })
  @ApiParam({ name: 'name', description: 'Nombre del rol' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rol encontrado exitosamente',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rol no encontrado',
  })
  async findByName(@Param('name') name: string): Promise<RoleResponseDto> {
    return await this.rolesService.findByName(name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rol actualizado exitosamente',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un rol con este nombre',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return await this.rolesService.update(id, updateRoleDto);
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Actualizar permisos de un rol' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permisos actualizados exitosamente',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rol no encontrado',
  })
  async updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissions') permissions: string[],
  ): Promise<RoleResponseDto> {
    return await this.rolesService.updatePermissions(id, permissions);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar un rol' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rol activado exitosamente',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rol no encontrado',
  })
  async activate(@Param('id', ParseIntPipe) id: number): Promise<RoleResponseDto> {
    return await this.rolesService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar un rol (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rol desactivado exitosamente',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rol no encontrado',
  })
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<RoleResponseDto> {
    return await this.rolesService.softDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un rol permanentemente' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rol eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'No se puede eliminar el rol porque tiene usuarios asignados',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.rolesService.remove(id);
    return { message: 'Rol eliminado exitosamente' };
  }

  @Get('permission/:permission')
  @ApiOperation({ summary: 'Obtener roles que tienen un permiso específico' })
  @ApiParam({ name: 'permission', description: 'Nombre del permiso' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roles con el permiso obtenidos exitosamente',
    type: [RoleResponseDto],
  })
  async getRolesByPermission(@Param('permission') permission: string): Promise<RoleResponseDto[]> {
    return await this.rolesService.getRolesByPermission(permission);
  }
}
