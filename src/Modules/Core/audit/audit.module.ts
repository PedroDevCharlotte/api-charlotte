import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog } from './Entity/audit-log.entity';
import { SessionLog } from './Entity/session-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, SessionLog])
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService], // Para que otros módulos puedan usar el servicio
})
export class AuditModule {}
