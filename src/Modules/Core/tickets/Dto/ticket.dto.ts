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
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus, TicketPriority, Ticket } from '../Entity/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ description: 'Título del ticket', example: 'Error en el sistema de login' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Descripción detallada del ticket' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ description: 'ID del tipo de ticket', example: 1 })
  @IsNumber()
  ticketTypeId: number;

  @ApiPropertyOptional({ 
    description: 'Prioridad del ticket', 
    enum: TicketPriority,
    default: TicketPriority.MEDIUM 
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'ID del usuario asignado' })
  @IsOptional()
  @IsNumber()
  assignedTo?: number;

  @ApiPropertyOptional({ description: 'ID del departamento responsable' })
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @ApiPropertyOptional({ description: 'Fecha límite (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Horas estimadas para resolución' })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Tags para categorización', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Si el ticket es urgente', default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Si el ticket es interno', default: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiPropertyOptional({ description: 'Campos personalizados adicionales' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'IDs de participantes iniciales', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  participantIds?: number[];
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'Título del ticket' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Descripción del ticket' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Estado del ticket', 
    enum: TicketStatus 
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ 
    description: 'Prioridad del ticket', 
    enum: TicketPriority 
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'ID del usuario asignado' })
  @IsOptional()
  @IsNumber()
  assignedTo?: number;

  @ApiPropertyOptional({ description: 'ID del departamento responsable' })
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @ApiPropertyOptional({ description: 'Fecha límite (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Horas estimadas para resolución' })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Horas reales de trabajo' })
  @IsOptional()
  @IsNumber()
  actualHours?: number;

  @ApiPropertyOptional({ description: 'Tags para categorización', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Si el ticket es urgente' })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Si el ticket es interno' })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiPropertyOptional({ description: 'Campos personalizados adicionales' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

export class TicketResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  ticketNumber: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: TicketStatus })
  status: TicketStatus;

  @ApiProperty({ enum: TicketPriority })
  priority: TicketPriority;

  @ApiProperty()
  ticketTypeId: number;

  @ApiProperty()
  createdBy: number;

  @ApiProperty({ nullable: true })
  assignedTo: number;

  @ApiProperty({ nullable: true })
  departmentId: number;

  @ApiProperty({ nullable: true })
  dueDate: Date;

  @ApiProperty({ nullable: true })
  resolvedAt: Date;

  @ApiProperty({ nullable: true })
  closedAt: Date;

  @ApiProperty({ nullable: true })
  estimatedHours: number;

  @ApiProperty({ nullable: true })
  actualHours: number;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  notificationsEnabled: boolean;

  @ApiProperty()
  isUrgent: boolean;

  @ApiProperty()
  isInternal: boolean;

  @ApiProperty()
  customFields: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relaciones pobladas
  @ApiPropertyOptional()
  ticketType?: any;

  @ApiPropertyOptional()
  creator?: any;

  @ApiPropertyOptional()
  assignee?: any;

  @ApiPropertyOptional()
  department?: any;

  @ApiPropertyOptional()
  participants?: any[];

  @ApiPropertyOptional()
  messages?: any[];

  @ApiPropertyOptional()
  attachments?: any[];

  constructor(ticket?: Partial<Ticket>) {
    if (ticket) {
      Object.assign(this, ticket);
    }
  }
}

export class TicketListResponseDto {
  @ApiProperty({ type: [TicketResponseDto] })
  tickets: TicketResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  constructor(tickets: TicketResponseDto[], total: number, page: number, limit: number) {
    this.tickets = tickets;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
