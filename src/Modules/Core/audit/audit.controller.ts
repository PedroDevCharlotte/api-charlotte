import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../../../Common/Auth/auth.guard';
import { AuditService } from './audit.service';
import { AuditLog } from './Entity/audit-log.entity';
import { SessionLog } from './Entity/session-log.entity';

@ApiTags('Audit')
@ApiBearerAuth('Token')
@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // ============ AUDIT LOG ENDPOINTS ============

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener historial de auditoría',
    description: 'Obtiene el historial de cambios con filtros opcionales'
  })
  @ApiQuery({ name: 'entityType', required: false, description: 'Tipo de entidad (User, Product, etc.)' })
  @ApiQuery({ name: 'action', required: false, description: 'Acción (CREATE, UPDATE, DELETE)' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (default: 50)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de auditoría obtenido exitosamente',
    type: [AuditLog]
  })
  async getAuditHistory(
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLog[]> {
    const filters: any = {};
    
    if (entityType) filters.entityType = entityType;
    if (action) filters.action = action;
    if (userId) filters.userId = Number(userId);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = Number(limit);

    return this.auditService.getAuditHistory(filters);
  }

  @Get('entity/:entityType/:entityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener historial de una entidad específica',
    description: 'Obtiene todos los cambios realizados a una entidad específica'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de la entidad obtenido exitosamente',
    type: [AuditLog]
  })
  async getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: number,
  ): Promise<AuditLog[]> {
    return this.auditService.getEntityHistory(entityType, Number(entityId));
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener historial de cambios por usuario',
    description: 'Obtiene todos los cambios realizados por un usuario específico'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (default: 50)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial del usuario obtenido exitosamente',
    type: [AuditLog]
  })
  async getUserHistory(
    @Param('userId') userId: number,
    @Query('limit') limit?: number,
  ): Promise<AuditLog[]> {
    return this.auditService.getUserHistory(Number(userId), limit ? Number(limit) : 50);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener estadísticas de auditoría',
    description: 'Obtiene estadísticas generales de auditoría'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente'
  })
  async getAuditStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.auditService.getAuditStats(start, end);
  }

  // ============ SESSION LOG ENDPOINTS ============

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener historial de sesiones del usuario actual',
    description: 'Obtiene el historial de sesiones del usuario autenticado'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (default: 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de sesiones obtenido exitosamente',
    type: [SessionLog]
  })
  async getUserSessions(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<SessionLog[]> {
    const userId = req.user.id;
    return this.auditService.getUserSessions(userId, limit ? Number(limit) : 20);
  }

  @Get('sessions/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener sesiones activas del usuario actual',
    description: 'Obtiene todas las sesiones activas del usuario autenticado'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sesiones activas obtenidas exitosamente',
    type: [SessionLog]
  })
  async getActiveSessions(@Request() req: any): Promise<SessionLog[]> {
    const userId = req.user.id;
    return this.auditService.getActiveSessions(userId);
  }

  @Post('sessions/logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cerrar todas las sesiones del usuario',
    description: 'Cierra todas las sesiones activas del usuario excepto la actual'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sesiones cerradas exitosamente'
  })
  async logoutAllSessions(@Request() req: any) {
    const userId = req.user.id;
    const currentSessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    await this.auditService.forceLogoutAllSessions(userId, currentSessionToken);
    
    return {
      message: 'Todas las sesiones han sido cerradas exitosamente',
      success: true,
    };
  }

  @Get('sessions/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener estadísticas de sesiones',
    description: 'Obtiene estadísticas generales de sesiones'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas de sesiones obtenidas exitosamente'
  })
  async getSessionStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.auditService.getSessionStats(start, end);
  }

  // ============ ADMIN ENDPOINTS ============

  @Get('admin/sessions/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener sesiones de un usuario específico (Admin)',
    description: 'Obtiene el historial de sesiones de cualquier usuario (solo admin)'
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (default: 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de sesiones obtenido exitosamente',
    type: [SessionLog]
  })
  async getAnyUserSessions(
    @Param('userId') userId: number,
    @Query('limit') limit?: number,
  ): Promise<SessionLog[]> {
    // TODO: Verificar que el usuario actual sea admin
    return this.auditService.getUserSessions(Number(userId), limit ? Number(limit) : 20);
  }

  @Post('admin/sessions/:userId/logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cerrar todas las sesiones de un usuario (Admin)',
    description: 'Cierra todas las sesiones activas de cualquier usuario (solo admin)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sesiones cerradas exitosamente'
  })
  async forceLogoutUser(@Param('userId') userId: number) {
    // TODO: Verificar que el usuario actual sea admin
    await this.auditService.forceLogoutAllSessions(Number(userId));
    
    return {
      message: `Todas las sesiones del usuario ${userId} han sido cerradas`,
      success: true,
    };
  }
}
