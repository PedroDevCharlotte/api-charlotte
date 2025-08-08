import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsBoolean,
  IsArray
} from 'class-validator';
import { ParticipantRole } from '../Entity/ticket-participant.entity';

export class AddTicketParticipantDto {
  @ApiProperty({ description: 'ID del ticket' })
  @IsNumber()
  ticketId: number;

  @ApiProperty({ description: 'ID del usuario a agregar' })
  @IsNumber()
  userId: number;

  @ApiProperty({ 
    description: 'Rol del participante', 
    enum: ParticipantRole 
  })
  @IsEnum(ParticipantRole)
  role: ParticipantRole;

  @ApiPropertyOptional({ description: 'Puede comentar', default: true })
  @IsOptional()
  @IsBoolean()
  canComment?: boolean;

  @ApiPropertyOptional({ description: 'Puede editar', default: false })
  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @ApiPropertyOptional({ description: 'Puede cerrar', default: false })
  @IsOptional()
  @IsBoolean()
  canClose?: boolean;

  @ApiPropertyOptional({ description: 'Puede asignar', default: false })
  @IsOptional()
  @IsBoolean()
  canAssign?: boolean;

  @ApiPropertyOptional({ description: 'Recibe notificaciones', default: true })
  @IsOptional()
  @IsBoolean()
  receiveNotifications?: boolean;
}

export class AddMultipleParticipantsDto {
  @ApiProperty({ description: 'ID del ticket' })
  @IsNumber()
  ticketId: number;

  @ApiProperty({ description: 'Lista de participantes a agregar', type: [AddTicketParticipantDto] })
  @IsArray()
  participants: Omit<AddTicketParticipantDto, 'ticketId'>[];
}

export class UpdateTicketParticipantDto {
  @ApiPropertyOptional({ 
    description: 'Rol del participante', 
    enum: ParticipantRole 
  })
  @IsOptional()
  @IsEnum(ParticipantRole)
  role?: ParticipantRole;

  @ApiPropertyOptional({ description: 'Puede comentar' })
  @IsOptional()
  @IsBoolean()
  canComment?: boolean;

  @ApiPropertyOptional({ description: 'Puede editar' })
  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @ApiPropertyOptional({ description: 'Puede cerrar' })
  @IsOptional()
  @IsBoolean()
  canClose?: boolean;

  @ApiPropertyOptional({ description: 'Puede asignar' })
  @IsOptional()
  @IsBoolean()
  canAssign?: boolean;

  @ApiPropertyOptional({ description: 'Recibe notificaciones' })
  @IsOptional()
  @IsBoolean()
  receiveNotifications?: boolean;
}

export class TicketParticipantResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  ticketId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty({ enum: ParticipantRole })
  role: ParticipantRole;

  @ApiProperty()
  canComment: boolean;

  @ApiProperty()
  canEdit: boolean;

  @ApiProperty()
  canClose: boolean;

  @ApiProperty()
  canAssign: boolean;

  @ApiProperty()
  receiveNotifications: boolean;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({ nullable: true })
  removedAt: Date;

  @ApiProperty({ nullable: true })
  addedBy: number;

  // Relaciones pobladas
  @ApiPropertyOptional()
  user?: any;

  @ApiPropertyOptional()
  addedByUser?: any;
}

// Re-exportar para compatibilidad
export type AddParticipantDto = AddTicketParticipantDto;
export type UpdateParticipantDto = UpdateTicketParticipantDto;
