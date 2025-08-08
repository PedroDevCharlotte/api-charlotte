import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MaxLength, IsNumber, IsHexColor, Min, Max, IsArray } from 'class-validator';

export class CreateTicketTypeDto {
  @ApiProperty({ description: 'Nombre del tipo de ticket', example: 'Soporte' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del tipo de ticket' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Código del tipo de ticket', example: 'SUPPORT' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ description: 'Color hexadecimal para UI', example: '#FF5722' })
  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ description: 'Prioridad para ordenamiento (0-999)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  priority?: number;

  @ApiPropertyOptional({ description: 'Si el tipo de ticket está activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID del usuario asignado por defecto para este tipo' })
  @IsOptional()
  @IsNumber()
  defaultUserId?: number;

  @ApiPropertyOptional({ description: 'Array de IDs de usuarios que pueden dar soporte a este tipo' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  supportUserIds?: number[];
}

export class UpdateTicketTypeDto {
  @ApiPropertyOptional({ description: 'Nombre del tipo de ticket' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Descripción del tipo de ticket' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Código del tipo de ticket' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ description: 'Color hexadecimal para UI' })
  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ description: 'Prioridad para ordenamiento (0-999)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999)
  priority?: number;

  @ApiPropertyOptional({ description: 'Si el tipo de ticket está activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID del usuario asignado por defecto para este tipo' })
  @IsOptional()
  @IsNumber()
  defaultUserId?: number;

  @ApiPropertyOptional({ description: 'Array de IDs de usuarios que pueden dar soporte a este tipo' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  supportUserIds?: number[];
}

export class TicketTypeResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Usuario asignado por defecto' })
  defaultUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Usuarios que pueden dar soporte a este tipo' })
  supportUsers?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
