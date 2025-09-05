
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'ID del rol asignado al usuario' })
  @IsOptional()
  @IsNumber()
  roleId?: number;

  @ApiPropertyOptional({ description: 'ID del departamento asignado al usuario' })
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @ApiPropertyOptional({ description: 'Si el usuario está activo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
  @ApiPropertyOptional({ description: 'Id del usuario' })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({ description: 'ID del jefe directo del usuario (para jerarquía)' })
  @IsOptional()
  @IsNumber()
  managerId?: number;

  @ApiPropertyOptional({ description: 'Array de IDs de subordinados asignados al usuario' })
  @IsOptional()
  subordinateIds?: number[];

  @ApiPropertyOptional({ description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Dias de expiracion de contraseña' })
  @IsOptional()
  @IsNumber()
  daysToPasswordExpiration?: number;
  @ApiPropertyOptional({ description: 'Apellido del usuario' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico del usuario' })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Contraseña del usuario' })
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ description: 'Si el 2FA está habilitado' })
  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Emoji generado del usuario' })
  @IsOptional()
  @IsString()
  emoji?: string;

  @ApiPropertyOptional({ description: 'Avatar serializado (JSON or dataURL) para personalización desde UI' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Rol del usuario (campo legacy, usar roleId)' })
  @IsOptional()
  @IsString()
  role?: string;


}
