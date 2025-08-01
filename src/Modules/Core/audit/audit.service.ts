import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './Entity/audit-log.entity';
import { SessionLog } from './Entity/session-log.entity';

export interface AuditLogData {
  entityType: string;
  entityId: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  userId?: number;
  userEmail?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

export interface SessionData {
  userId: number;
  userEmail: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
  loginMethod?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(SessionLog)
    private sessionLogRepository: Repository<SessionLog>,
  ) {}

  // ============ AUDIT LOG METHODS ============

  /**
   * Registra un cambio en el sistema
   */
  async logChange(data: AuditLogData): Promise<AuditLog> {
    try {
      const changedFields = this.getChangedFields(data.oldValues, data.newValues);
      
      const auditLog = new AuditLog();
      auditLog.entityType = data.entityType;
      auditLog.entityId = data.entityId;
      auditLog.action = data.action;
      auditLog.userId = data.userId || null;
      auditLog.userEmail = data.userEmail || null;
      auditLog.oldValues = data.oldValues ? JSON.stringify(data.oldValues) : null;
      auditLog.newValues = data.newValues ? JSON.stringify(data.newValues) : null;
      auditLog.changedFields = JSON.stringify(changedFields);
      auditLog.ipAddress = data.ipAddress || null;
      auditLog.userAgent = data.userAgent || null;
      auditLog.description = data.description || null;

      const savedLog = await this.auditLogRepository.save(auditLog);
      
      this.logger.log(`Audit log created: ${data.action} on ${data.entityType}:${data.entityId} by user ${data.userId}`);
      
      return savedLog;
    } catch (error) {
      this.logger.error('Error creating audit log:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el historial de cambios de una entidad específica
   */
  async getEntityHistory(entityType: string, entityId: number): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Obtiene el historial de cambios por usuario
   */
  async getUserHistory(userId: number, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  /**
   * Obtiene el historial general con filtros
   */
  async getAuditHistory(filters: {
    entityType?: string;
    action?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    if (filters.entityType) {
      query.andWhere('audit.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.action) {
      query.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.userId) {
      query.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters.limit) {
      query.take(filters.limit);
    }

    return query.getMany();
  }

  // ============ SESSION LOG METHODS ============

  /**
   * Registra un nuevo inicio de sesión
   */
  async logLogin(data: SessionData): Promise<SessionLog> {
    try {
      const sessionLog = this.sessionLogRepository.create({
        userId: data.userId,
        userEmail: data.userEmail,
        sessionToken: data.sessionToken,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceInfo: data.deviceInfo,
        location: data.location,
        loginMethod: data.loginMethod || 'PASSWORD',
        isActive: true,
        lastActivity: new Date(),
      });

      const savedSession = await this.sessionLogRepository.save(sessionLog);
      
      this.logger.log(`Session started for user ${data.userId} from IP ${data.ipAddress}`);
      
      return savedSession;
    } catch (error) {
      this.logger.error('Error creating session log:', error.message);
      throw error;
    }
  }

  /**
   * Registra el cierre de sesión
   */
  async logLogout(sessionToken: string, reason: string = 'MANUAL'): Promise<void> {
    try {
      await this.sessionLogRepository.update(
        { sessionToken, isActive: true },
        {
          isActive: false,
          logoutAt: new Date(),
          logoutReason: reason,
        }
      );

      this.logger.log(`Session ended with reason: ${reason}`);
    } catch (error) {
      this.logger.error('Error updating session log:', error.message);
      throw error;
    }
  }

  /**
   * Actualiza la última actividad de una sesión
   */
  async updateLastActivity(sessionToken: string): Promise<void> {
    try {
      await this.sessionLogRepository.update(
        { sessionToken, isActive: true },
        { lastActivity: new Date() }
      );
    } catch (error) {
      this.logger.error('Error updating last activity:', error.message);
    }
  }

  /**
   * Obtiene las sesiones activas de un usuario
   */
  async getActiveSessions(userId: number): Promise<SessionLog[]> {
    return this.sessionLogRepository.find({
      where: { userId, isActive: true },
      order: { loginAt: 'DESC' },
    });
  }

  /**
   * Obtiene el historial de sesiones de un usuario
   */
  async getUserSessions(userId: number, limit: number = 20): Promise<SessionLog[]> {
    return this.sessionLogRepository.find({
      where: { userId },
      order: { loginAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  /**
   * Cierra todas las sesiones activas de un usuario (excepto la actual)
   */
  async forceLogoutAllSessions(userId: number, currentSessionToken?: string): Promise<void> {
    const query = this.sessionLogRepository.createQueryBuilder()
      .update(SessionLog)
      .set({
        isActive: false,
        logoutAt: new Date(),
        logoutReason: 'FORCE',
      })
      .where('userId = :userId AND isActive = true', { userId });

    if (currentSessionToken) {
      query.andWhere('sessionToken != :currentSessionToken', { currentSessionToken });
    }

    await query.execute();
    
    this.logger.log(`Force logout all sessions for user ${userId}`);
  }

  /**
   * Limpia sesiones expiradas (más de X días inactivas)
   */
  async cleanupExpiredSessions(daysInactive: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    await this.sessionLogRepository.update(
      {
        isActive: true,
        lastActivity: this.sessionLogRepository.createQueryBuilder()
          .where('lastActivity < :cutoffDate', { cutoffDate })
          .getQuery() as any,
      },
      {
        isActive: false,
        logoutAt: new Date(),
        logoutReason: 'EXPIRED',
      }
    );

    this.logger.log(`Cleaned up expired sessions older than ${daysInactive} days`);
  }

  // ============ HELPER METHODS ============

  /**
   * Compara valores anteriores y nuevos para determinar qué campos cambiaron
   */
  private getChangedFields(oldValues: any, newValues: any): string[] {
    if (!oldValues || !newValues) return [];

    const changedFields: string[] = [];
    
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  async getAuditStats(startDate?: Date, endDate?: Date) {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    const [
      totalLogs,
      createCount,
      updateCount,
      deleteCount,
    ] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('audit.action = :action', { action: 'CREATE' }).getCount(),
      query.clone().andWhere('audit.action = :action', { action: 'UPDATE' }).getCount(),
      query.clone().andWhere('audit.action = :action', { action: 'DELETE' }).getCount(),
    ]);

    return {
      totalLogs,
      actions: {
        create: createCount,
        update: updateCount,
        delete: deleteCount,
      },
    };
  }

  /**
   * Obtiene estadísticas de sesiones
   */
  async getSessionStats(startDate?: Date, endDate?: Date) {
    const query = this.sessionLogRepository.createQueryBuilder('session');

    if (startDate) {
      query.andWhere('session.loginAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('session.loginAt <= :endDate', { endDate });
    }

    const [
      totalSessions,
      activeSessions,
      uniqueUsers,
    ] = await Promise.all([
      query.getCount(),
      this.sessionLogRepository.count({ where: { isActive: true } }),
      query.select('COUNT(DISTINCT session.userId)', 'count').getRawOne(),
    ]);

    return {
      totalSessions,
      activeSessions,
      uniqueUsers: parseInt(uniqueUsers.count),
    };
  }
}
