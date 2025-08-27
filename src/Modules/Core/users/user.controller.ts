import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Delete,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../Common/Auth/auth.guard';
import { UsersService } from './users.service';
import { UserDto } from './Dto/user.dto';
import { CreateUserLegacyDto, CreateUserDto } from './Dto/create-user.dto';
import { UpdateUserDto } from './Dto/update-user.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequestPasswordResetDto } from './Dto/request-password-reset.dto';
import { VerifyPasswordResetDto } from './Dto/verify-password-reset.dto';
import { ExpiringPasswordUser, PasswordExpirationCheckResult } from './interfaces/password-expiration.interface';
@ApiTags('Users')
@ApiBearerAuth('Token')
@Controller('user')
export class UserController {
  constructor(private usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('list')
  getAllUsers() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  getUserById(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  // @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('insert')
  @ApiOperation({ summary: 'Crear un nuevo usuario (formato moderno)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createUser(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    const authToken = req.headers.authorization;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.usersService.create(createUserDto, authToken, ipAddress, userAgent);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('insert-legacy')
  @ApiOperation({ summary: 'Crear un nuevo usuario (formato legacy)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  createUserLegacy(@Body() createUserLegacyDto: CreateUserLegacyDto, @Request() req: any) {
    const authToken = req.headers.authorization;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Convertir el DTO legacy al formato correcto
    const userDto = createUserLegacyDto.toUserDto();
    
    return this.usersService.create(userDto, authToken, ipAddress, userAgent);
  }

  // ENDPOINT TEMPORAL PARA TESTING - REMOVER EN PRODUCCIÓN
  @HttpCode(HttpStatus.CREATED)
  @Post('test-insert')
  @ApiOperation({ summary: 'Crear usuario (SOLO TESTING)' })
  testCreateUser(@Body() createUserLegacyDto: CreateUserLegacyDto, @Request() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Convertir el DTO legacy al formato correcto
    const userDto = createUserLegacyDto.toUserDto();
    
    return this.usersService.create(userDto, undefined, ipAddress, userAgent);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Put('update')
  @ApiOperation({ summary: 'Actualizar un usuario existente' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  updateUser( @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    const authToken = req.headers.authorization;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Agregar el ID al DTO de actualización
    const updateDataWithId = { ...updateUserDto};
    
    return this.usersService.update(updateUserDto, authToken, ipAddress, userAgent);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('delete/:id')
  @ApiOperation({ 
    summary: 'Eliminar usuario por ID',
    description: 'Elimina un usuario del sistema usando su ID'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Usuario eliminado exitosamente' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado' 
  })
  deleteUser(@Param('id') id: number, @Request() req: any) {
    const authToken = req.headers.authorization;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.usersService.delete(id, authToken, ipAddress, userAgent);
  }

  // ========== ENDPOINTS PARA RESET DE CONTRASEÑA ==========

  @HttpCode(HttpStatus.OK)
  @Post('request-password-reset')
  @ApiOperation({ 
    summary: 'Solicitar restablecimiento de contraseña',
    description: 'Envía un código de verificación al email del usuario para restablecer la contraseña'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Código enviado exitosamente (si el email existe)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Código de verificación enviado a tu correo electrónico.' },
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error al enviar el código' 
  })
  async requestPasswordReset(@Body() requestDto: RequestPasswordResetDto) {
    return this.usersService.requestPasswordReset(requestDto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-password-reset')
  @ApiOperation({ 
    summary: 'Verificar código y restablecer contraseña',
    description: 'Verifica el código de 6 dígitos y establece la nueva contraseña'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraseña restablecida exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Contraseña restablecida exitosamente.' },
        success: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Código inválido o expirado' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuario no encontrado' 
  })
  async verifyPasswordReset(@Body() verifyDto: VerifyPasswordResetDto) {
    return this.usersService.verifyPasswordReset(
      verifyDto.email,
      verifyDto.code,
      verifyDto.newPassword
    );
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('check-password-expiration')
  @ApiOperation({ 
    summary: 'Verificar contraseñas próximas a vencer y enviar notificaciones',
    description: 'Endpoint que revisa todas las contraseñas próximas a vencer y envía notificaciones por email a los usuarios correspondientes. Normalmente se ejecuta mediante un cron job.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Verificación completada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Verificación de contraseñas completada. Se enviaron 5 notificaciones.' },
        notificationsSent: { type: 'number', example: 5 },
        usersChecked: { type: 'number', example: 150 }
      }
    }
  })
  async checkPasswordExpiration(@Request() req: any): Promise<PasswordExpirationCheckResult> {
    // Solo usuarios con rol de administrador pueden ejecutar esta verificación
    return this.usersService.checkPasswordExpiration();
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('expiring-passwords/:days')
  @ApiOperation({ 
    summary: 'Obtener lista de usuarios con contraseñas próximas a vencer',
    description: 'Obtiene una lista de usuarios cuyas contraseñas vencerán en los próximos días especificados. Por defecto busca en los próximos 7 días.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios con contraseñas próximas a vencer',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          department: { type: 'string' },
          dateToPasswordExpiration: { type: 'string', format: 'date-time' },
          daysRemaining: { type: 'number' },
          status: { type: 'string', enum: ['Vencida', 'Vence mañana', 'Crítico', 'Próximo a vencer'] }
        }
      }
    }
  })
  async getExpiringPasswords(@Param('days') days?: string): Promise<ExpiringPasswordUser[]> {
    const daysToCheck = days ? parseInt(days, 10) : 7;
    return this.usersService.getUsersWithExpiringPasswords(daysToCheck);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('expiring-passwords')
  @ApiOperation({ 
    summary: 'Obtener lista de usuarios con contraseñas próximas a vencer (7 días por defecto)',
    description: 'Obtiene una lista de usuarios cuyas contraseñas vencerán en los próximos 7 días.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de usuarios con contraseñas próximas a vencer',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          department: { type: 'string' },
          dateToPasswordExpiration: { type: 'string', format: 'date-time' },
          daysRemaining: { type: 'number' },
          status: { type: 'string', enum: ['Vencida', 'Vence mañana', 'Crítico', 'Próximo a vencer'] }
        }
      }
    }
  })
  async getExpiringPasswordsDefault(): Promise<ExpiringPasswordUser[]> {
    return this.usersService.getUsersWithExpiringPasswords(7);
  }

  // ========================================
  // ENDPOINTS PARA JERARQUÍA DE USUARIOS
  // ========================================

  @UseGuards(AuthGuard)
  @Get(':id/subordinates')
  @ApiOperation({ summary: 'Obtener subordinados de un usuario' })
  @ApiResponse({ status: 200, description: 'Lista de subordinados obtenida exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async getSubordinates(@Param('id') id: number) {
    return this.usersService.getSubordinates(id);
  }

  @UseGuards(AuthGuard)
  @Get(':id/manager')
  @ApiOperation({ summary: 'Obtener jefe directo de un usuario' })
  @ApiResponse({ status: 200, description: 'Jefe directo obtenido exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async getManager(@Param('id') id: number) {
    return this.usersService.getManager(id);
  }

  @UseGuards(AuthGuard)
  @Put(':id/assign-manager/:managerId')
  @ApiOperation({ summary: 'Asignar jefe a un usuario' })
  @ApiResponse({ status: 200, description: 'Jefe asignado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Esta asignación crearía un bucle en la jerarquía.' })
  @ApiResponse({ status: 404, description: 'Usuario o jefe no encontrado.' })
  async assignManager(@Param('id') id: number, @Param('managerId') managerId: number) {
    return this.usersService.assignManager(id, managerId);
  }

  @UseGuards(AuthGuard)
  @Get(':id/available-managers')
  @ApiOperation({ summary: 'Obtener usuarios disponibles para ser jefes' })
  @ApiResponse({ status: 200, description: 'Lista de posibles jefes obtenida exitosamente.' })
  async getAvailableManagers(@Param('id') id: number) {
    return this.usersService.getAvailableManagers(id);
  }

  // ========================================
  // ENDPOINTS PARA TIPOS DE SOPORTE
  // ========================================

  @UseGuards(AuthGuard)
  @Get(':id/support-types')
  @ApiOperation({ summary: 'Obtener tipos de soporte que puede manejar un usuario' })
  @ApiResponse({ status: 200, description: 'Tipos de soporte obtenidos exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async getUserSupportTypes(@Param('id') id: number) {
    return this.usersService.getUserSupportTypes(id);
  }

  @UseGuards(AuthGuard)
  @Put(':id/support-types')
  @ApiOperation({ summary: 'Asignar tipos de soporte a un usuario' })
  @ApiResponse({ status: 200, description: 'Tipos de soporte asignados exitosamente.' })
  @ApiResponse({ status: 400, description: 'Algunos tipos de soporte no existen.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async assignSupportTypes(
    @Param('id') id: number,
    @Body() body: { supportTypeIds: number[] }
  ) {
    return this.usersService.assignSupportTypes(id, body.supportTypeIds);
  }

  @UseGuards(AuthGuard)
  @Get('by-support-type/:ticketTypeId')
  @ApiOperation({ summary: 'Obtener usuarios que pueden dar soporte a un tipo específico' })
  @ApiResponse({ status: 200, description: 'Usuarios obtenidos exitosamente.' })
  @ApiResponse({ status: 404, description: 'Tipo de ticket no encontrado.' })
  async getUsersBySupportType(@Param('ticketTypeId') ticketTypeId: number) {
    return this.usersService.getUsersBySupportType(ticketTypeId);
  }
}
