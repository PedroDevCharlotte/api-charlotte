import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Nombre único del permiso', example: 'tickets.create' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del permiso' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Ruta o path del módulo al que pertenece el permiso', example: '/tickets' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  modulePath?: string;

  @ApiPropertyOptional({ description: 'Si el permiso está activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional({ description: 'Nombre del permiso' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Descripción del permiso' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Ruta o path del módulo al que pertenece el permiso' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  modulePath?: string;

  @ApiPropertyOptional({ description: 'Si el permiso está activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PermissionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  modulePath: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
