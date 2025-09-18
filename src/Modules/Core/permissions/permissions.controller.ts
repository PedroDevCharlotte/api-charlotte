import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto, PermissionResponseDto } from './Dto/permission.dto';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all permissions' })
  @ApiResponse({ status: 200, description: 'Array of permissions', type: [PermissionResponseDto] })
  getAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by id' })
  @ApiResponse({ status: 200, description: 'Permission object', type: PermissionResponseDto })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a permission' })
  @ApiResponse({ status: 201, description: 'Created permission', type: PermissionResponseDto })
  create(@Body() payload: CreatePermissionDto) {
    return this.permissionsService.create(payload as any);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiResponse({ status: 200, description: 'Updated permission', type: PermissionResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdatePermissionDto) {
    return this.permissionsService.update(id, payload as any);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }
}
