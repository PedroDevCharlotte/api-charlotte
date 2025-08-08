import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsArray, 
  IsBoolean, 
  IsDateString, 
  MaxLength, 
  MinLength,
  IsObject,
  ValidateNested,
  ArrayNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketPriority } from '../Entity/ticket.entity';
import { ParticipantRole } from '../Entity/ticket-participant.entity';

export class TicketAttachmentDto {
  @ApiProperty({ description: 'Nombre del archivo', example: 'error_screenshot.png' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'Nombre original del archivo', example: 'captura_pantalla.png' })
  @IsString()
  originalFileName: string;

  @ApiProperty({ description: 'Ruta del archivo', example: '/uploads/tickets/2025/08/file123.png' })
  @IsString()
  filePath: string;

  @ApiProperty({ description: 'Tipo MIME del archivo', example: 'image/png' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes', example: 150000 })
  @IsNumber()
  fileSize: number;

  @ApiPropertyOptional({ description: 'Descripción del archivo' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class TicketParticipantDto {
  @ApiProperty({ description: 'ID del usuario participante', example: 5 })
  @IsNumber()
  userId: number;

  @ApiProperty({ 
    description: 'Rol del participante', 
    enum: ParticipantRole,
    example: ParticipantRole.COLLABORATOR 
  })
  @IsEnum(ParticipantRole)
  role: ParticipantRole;

  @ApiPropertyOptional({ description: 'Permisos para editar el ticket', default: false })
  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @ApiPropertyOptional({ description: 'Permisos para agregar comentarios', default: true })
  @IsOptional()
  @IsBoolean()
  canComment?: boolean;
}

export class CreateCompleteTicketDto {
  @ApiProperty({ 
    description: 'Asunto/título del ticket', 
    example: 'Error en el sistema de autenticación' 
  })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiProperty({ 
    description: 'ID del tipo de ticket',
    example: 1
  })
  @IsNumber()
  ticketTypeId: number;

  @ApiProperty({ 
    description: 'Descripción detallada del problema o solicitud',
    example: 'Los usuarios no pueden iniciar sesión. El sistema muestra error 500 al intentar autenticarse.'
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ 
    description: 'ID del usuario que levanta el ticket',
    example: 3
  })
  @IsNumber()
  createdByUserId: number;

  @ApiPropertyOptional({ 
    description: 'Campos personalizados específicos del tipo de ticket' 
  })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Mensaje inicial/descripción adicional que se agregará como primer comentario',
    example: 'El error comenzó esta mañana alrededor de las 9:00 AM'
  })
  @IsOptional()
  @IsString()
  initialMessage?: string;

  @ApiPropertyOptional({ 
    description: 'Lista de archivos adjuntos',
    type: [TicketAttachmentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketAttachmentDto)
  attachments?: TicketAttachmentDto[];

  @ApiPropertyOptional({ 
    description: 'Lista de personas relacionadas/participantes',
    type: [TicketParticipantDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketParticipantDto)
  participants?: TicketParticipantDto[];

  @ApiPropertyOptional({ 
    description: 'Prioridad del ticket', 
    enum: TicketPriority,
    default: TicketPriority.MEDIUM 
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ 
    description: 'Fecha límite para resolución (ISO 8601)',
    example: '2025-08-15T10:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ 
    description: 'Horas estimadas para resolución',
    example: 8
  })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional({ 
    description: 'Tags para categorización', 
    type: [String],
    example: ['urgente', 'autenticacion', 'produccion']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Si el ticket es marcado como urgente', 
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ 
    description: 'Si el ticket es interno (solo para empleados)', 
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiPropertyOptional({ 
    description: 'Si las notificaciones están habilitadas', 
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({ 
    description: 'ID del departamento responsable (opcional, se puede asignar automáticamente)' 
  })
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @ApiPropertyOptional({ 
    description: 'ID del usuario asignado específico (opcional, se asigna automáticamente por defecto)' 
  })
  @IsOptional()
  @IsNumber()
  assignedTo?: number;
}

export class CompleteTicketResponseDto {
  @ApiProperty({ description: 'Ticket creado' })
  ticket: any;

  @ApiProperty({ description: 'Usuario asignado automáticamente' })
  assignedUser: any;

  @ApiProperty({ description: 'Mensaje inicial creado', required: false })
  initialMessage?: any;

  @ApiProperty({ description: 'Archivos adjuntos procesados', type: [Object] })
  attachments: any[];

  @ApiProperty({ description: 'Participantes agregados', type: [Object] })
  participants: any[];

  @ApiProperty({ description: 'Número de ticket generado' })
  ticketNumber: string;

  @ApiProperty({ description: 'Información adicional del procesamiento' })
  processingInfo: {
    autoAssigned: boolean;
    assignmentReason: string;
    defaultUserUsed: boolean;
  };
}
