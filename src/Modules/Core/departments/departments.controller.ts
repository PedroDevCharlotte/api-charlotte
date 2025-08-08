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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto, DepartmentResponseDto } from './Dto/department.dto';
import { AuthGuard } from '../../../Common/Auth/auth.guard';

@ApiTags('Departments')
@ApiBearerAuth('Token')
@UseGuards(AuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo departamento' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Departamento creado exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un departamento con este nombre o código',
  })
  async create(@Body() createDepartmentDto: CreateDepartmentDto): Promise<DepartmentResponseDto> {
    return await this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los departamentos activos' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Incluir departamentos inactivos',
    type: Boolean,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de departamentos obtenida exitosamente',
    type: [DepartmentResponseDto],
  })
  async findAll(@Query('includeInactive') includeInactive?: boolean): Promise<DepartmentResponseDto[]> {
    if (includeInactive) {
      return await this.departmentsService.findAllIncludingInactive();
    }
    return await this.departmentsService.findAll();
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Obtener la jerarquía de departamentos con managers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Jerarquía de departamentos obtenida exitosamente',
    type: [DepartmentResponseDto],
  })
  async getDepartmentHierarchy(): Promise<DepartmentResponseDto[]> {
    return await this.departmentsService.getDepartmentHierarchy();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un departamento por ID' })
  @ApiParam({ name: 'id', description: 'ID del departamento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departamento encontrado exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Departamento no encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<DepartmentResponseDto> {
    return await this.departmentsService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Obtener un departamento por código' })
  @ApiParam({ name: 'code', description: 'Código del departamento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departamento encontrado exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Departamento no encontrado',
  })
  async findByCode(@Param('code') code: string): Promise<DepartmentResponseDto> {
    return await this.departmentsService.findByCode(code);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Obtener un departamento por nombre' })
  @ApiParam({ name: 'name', description: 'Nombre del departamento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departamento encontrado exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Departamento no encontrado',
  })
  async findByName(@Param('name') name: string): Promise<DepartmentResponseDto> {
    return await this.departmentsService.findByName(name);
  }

  @Get('manager/:managerId')
  @ApiOperation({ summary: 'Obtener departamentos gestionados por un manager' })
  @ApiParam({ name: 'managerId', description: 'ID del manager' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departamentos del manager obtenidos exitosamente',
    type: [DepartmentResponseDto],
  })
  async getDepartmentsByManager(@Param('managerId', ParseIntPipe) managerId: number): Promise<DepartmentResponseDto[]> {
    return await this.departmentsService.getDepartmentsByManager(managerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un departamento' })
  @ApiParam({ name: 'id', description: 'ID del departamento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departamento actualizado exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Departamento no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un departamento con este nombre o código',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return await this.departmentsService.update(id, updateDepartmentDto);
  }

  @Patch(':id/manager/:managerId')
  @ApiOperation({ summary: 'Asignar manager a un departamento' })
  @ApiParam({ name: 'id', description: 'ID del departamento' })
  @ApiParam({ name: 'managerId', description: 'ID del manager' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Manager asignado exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Departamento no encontrado',
  })
  async setManager(
    @Param('id', ParseIntPipe) id: number,
    @Param('managerId', ParseIntPipe) managerId: number,
  ): Promise<DepartmentResponseDto> {
    return await this.departmentsService.setManager(id, managerId);
  }

  @Patch(':id/remove-manager')
  @ApiOperation({ summary: 'Remover manager de un departamento' })
  @ApiParam({ name: 'id', description: 'ID del departamento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Manager removido exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Departamento no encontrado',
  })
  async removeManager(@Param('id', ParseIntPipe) id: number): Promise<DepartmentResponseDto> {
    return await this.departmentsService.removeManager(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activar un departamento' })
  @ApiParam({ name: 'id', description: 'ID del departamento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departamento activado exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Departamento no encontrado',
  })
  async activate(@Param('id', ParseIntPipe) id: number): Promise<DepartmentResponseDto> {
    return await this.departmentsService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar un departamento (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del departamento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departamento desactivado exitosamente',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Departamento no encontrado',
  })
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<DepartmentResponseDto> {
    return await this.departmentsService.softDelete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un departamento permanentemente' })
  @ApiParam({ name: 'id', description: 'ID del departamento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Departamento eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Departamento no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'No se puede eliminar el departamento porque tiene usuarios asignados',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.departmentsService.remove(id);
    return { message: 'Departamento eliminado exitosamente' };
  }
}
