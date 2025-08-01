import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../Modules/Core/audit/audit.service';
import { Reflector } from '@nestjs/core';

// Decorator para marcar métodos que deben ser auditados
export const Auditable = (entityType: string, action: 'CREATE' | 'UPDATE' | 'DELETE') =>
  Reflect.metadata('audit', { entityType, action });

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<{ entityType: string; action: string }>('audit', context.getHandler());
    
    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Determinar el ID de la entidad del response o request
          let entityId: number;
          
          if (response && response.id) {
            entityId = response.id;
          } else if (request.params && request.params.id) {
            entityId = parseInt(request.params.id);
          } else if (request.body && request.body.id) {
            entityId = request.body.id;
          } else {
            // Si no se puede determinar el ID, no auditar
            return;
          }

          // Preparar datos para auditoría
          const auditData = {
            entityType: auditMetadata.entityType,
            entityId,
            action: auditMetadata.action as 'CREATE' | 'UPDATE' | 'DELETE',
            userId: user?.id,
            userEmail: user?.email,
            newValues: auditMetadata.action !== 'DELETE' ? request.body : undefined,
            oldValues: auditMetadata.action === 'UPDATE' ? request.originalData : undefined, // Se debe establecer en el servicio
            ipAddress,
            userAgent,
            description: `${auditMetadata.action} operation on ${auditMetadata.entityType}`,
          };

          await this.auditService.logChange(auditData);
        } catch (error) {
          console.error('Error logging audit data:', error);
          // No fallar la operación principal por errores de auditoría
        }
      }),
    );
  }
}
