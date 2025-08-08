import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class UserDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Rol del usuario (campo legacy, usar roleId)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ description: 'ID del rol asignado al usuario' })
  @IsNumber()
  roleId: number;

  @ApiProperty({ description: 'ID del departamento asignado al usuario' })
  @IsNumber()
  departmentId: number;

  @ApiPropertyOptional({ description: 'ID del jefe directo del usuario (para jerarquía)' })
  @IsOptional()
  @IsNumber()
  managerId?: number;

  @ApiPropertyOptional({ description: 'Array de IDs de tipos de soporte que puede manejar' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  supportTypeIds?: number[];

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passwordResetCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  passwordResetCodeExpiresAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twoFactorSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  temp2FASecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  last2FAVerifiedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trustedDevices?: string[];
}
