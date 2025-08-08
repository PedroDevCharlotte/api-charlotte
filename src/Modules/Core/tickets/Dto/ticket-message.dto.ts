import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsBoolean,
  MinLength,
  IsObject
} from 'class-validator';
import { MessageType } from '../Entity/ticket-message.entity';

export class CreateTicketMessageDto {
  @ApiProperty({ description: 'ID del ticket' })
  @IsNumber()
  ticketId: number;

  @ApiProperty({ description: 'Contenido del mensaje' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({ 
    description: 'Tipo de mensaje', 
    enum: MessageType,
    default: MessageType.COMMENT 
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ description: 'ID del mensaje al que responde' })
  @IsOptional()
  @IsNumber()
  replyToId?: number;

  @ApiPropertyOptional({ description: 'Si el mensaje es interno', default: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiPropertyOptional({ description: 'Metadatos adicionales del mensaje' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateTicketMessageDto {
  @ApiPropertyOptional({ description: 'Contenido del mensaje' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional({ description: 'Si el mensaje es interno' })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiPropertyOptional({ description: 'Metadatos adicionales del mensaje' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class TicketMessageResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  ticketId: number;

  @ApiProperty()
  senderId: number;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  isInternal: boolean;

  @ApiProperty()
  isEdited: boolean;

  @ApiProperty({ nullable: true })
  replyToId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  editedAt: Date;

  @ApiProperty({ nullable: true })
  editedBy: number;

  // Relaciones pobladas
  @ApiPropertyOptional()
  sender?: any;

  @ApiPropertyOptional()
  replyTo?: any;

  @ApiPropertyOptional()
  replies?: any[];

  @ApiPropertyOptional()
  reads?: any[];
}

export class TicketMessageListResponseDto {
  @ApiProperty({ type: [TicketMessageResponseDto] })
  messages: TicketMessageResponseDto[];

  @ApiProperty({ description: 'Total de mensajes' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Límite por página' })
  limit: number;
}
