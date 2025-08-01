import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'Nombre del departamento', example: 'Tecnología' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del departamento' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Código del departamento', example: 'IT' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  code?: string;

  @ApiPropertyOptional({ description: 'ID del manager del departamento' })
  @IsOptional()
  @IsNumber()
  managerId?: number;

  @ApiPropertyOptional({ description: 'Si el departamento está activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ description: 'Nombre del departamento' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Descripción del departamento' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Código del departamento' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  code?: string;

  @ApiPropertyOptional({ description: 'ID del manager del departamento' })
  @IsOptional()
  @IsNumber()
  managerId?: number;

  @ApiPropertyOptional({ description: 'Si el departamento está activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DepartmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ nullable: true })
  managerId?: number | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
