import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsBoolean,
} from 'class-validator';
export class ReorderBannerDto {
  @ApiProperty({ example: 7 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  order: number;
}

export class ReorderBannersDtoArray {
  @ApiProperty({ type: [ReorderBannerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderBannerDto)
  order: ReorderBannerDto[];
}
// ...existing code...


export class CreateBannerDto {
  @ApiProperty({ example: 'Promoción Julio' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: 'Descripción corta del banner' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'https://example.com' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({ required: false, description: 'Fecha de inicio ISO 8601', example: '2025-08-25T00:00:00Z' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Fecha de finalización ISO 8601', example: '2025-09-01T00:00:00Z' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Estado de negocio (activo/inactivo). Si se proveen fechas, se calcula automáticamente.' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;

  @ApiProperty({ required: false, description: 'Orden de visualización' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @ApiProperty({ required: false, description: 'Activo' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;
}

export class UpdateBannerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;
}
