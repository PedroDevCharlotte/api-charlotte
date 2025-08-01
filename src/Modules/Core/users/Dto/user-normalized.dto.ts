import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean, IsNumber, MaxLength, MinLength } from 'class-validator';

export class CreateUserNormalizedDto {
  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ description: 'Email del usuario', example: 'juan.perez@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'ID del rol del usuario', example: 1 })
  @IsNumber()
  roleId: number;

  @ApiPropertyOptional({ description: 'ID del departamento del usuario', example: 1 })
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @ApiPropertyOptional({ description: 'Si el usuario está activo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Si el usuario está bloqueado', default: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

export class UpdateUserNormalizedDto {
  @ApiPropertyOptional({ description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Email del usuario' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Contraseña del usuario' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'ID del rol del usuario' })
  @IsOptional()
  @IsNumber()
  roleId?: number;

  @ApiPropertyOptional({ description: 'ID del departamento del usuario' })
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @ApiPropertyOptional({ description: 'Si el usuario está activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Si el usuario está bloqueado' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

export class UserNormalizedResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  roleId: number;

  @ApiProperty({ nullable: true })
  departmentId?: number | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isBlocked: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relaciones pobladas
  @ApiPropertyOptional()
  role?: {
    id: number;
    name: string;
    permissions: string[];
  };

  @ApiPropertyOptional()
  department?: {
    id: number;
    name: string;
    code: string;
  };
}
