import { IsOptional, IsString, IsNumber, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class AuditFilterDto {
  @ApiProperty({
    description: 'Tipo de entidad',
    example: 'User',
    required: false,
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({
    description: 'Acción realizada',
    example: 'CREATE',
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    required: false,
  })
  @IsOptional()
  @IsIn(['CREATE', 'UPDATE', 'DELETE'])
  action?: 'CREATE' | 'UPDATE' | 'DELETE';

  @ApiProperty({
    description: 'ID del usuario que realizó la acción',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  userId?: number;

  @ApiProperty({
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Límite de resultados',
    example: 50,
    minimum: 1,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;
}

export class SessionFilterDto {
  @ApiProperty({
    description: 'Límite de resultados',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
