import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'Nombre del usuario' })
  @IsString()
  @Transform(({ obj }) => obj.firstName || obj.name)
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario' })
  @IsString()
  @Transform(({ obj }) => obj.lastName || obj.lastname)
  lastName: string;

  @ApiPropertyOptional({ description: 'ID del jefe directo del usuario (para jerarquía)' })
  @IsOptional()
  @IsNumber()
  managerId?: number;

  @ApiPropertyOptional({ description: 'Array de IDs de subordinados asignados al usuario' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  subordinateIds?: number[];

  @ApiPropertyOptional({ description: 'Rol del usuario (campo legacy, usar roleId)' })
  @IsOptional()
  @IsString()
  @Transform(({ obj }) => {
    if (Array.isArray(obj.rol)) {
      return obj.rol[0] || 'user'; // Tomar el primer elemento del array o 'user' por defecto
    }
    return obj.role || obj.rol || 'user';
  })
  role?: string;

  @ApiProperty({ description: 'ID del rol asignado al usuario' })
  @IsNumber()
  roleId: number;

  
  @ApiProperty({ description: 'dias de expiracion de contraseña' })
  @IsNumber()
  daysToPasswordExpiration: number;

  @ApiProperty({ description: 'ID del departamento asignado al usuario' })
  @IsNumber()
  departmentId: number;

  @ApiProperty({ description: 'Email único del usuario' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Si el usuario está activo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true; // Por defecto activo

  @ApiPropertyOptional({ description: 'Si el usuario está bloqueado' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean = false; // Por defecto no bloqueado

  @ApiPropertyOptional({ description: 'Si el 2FA está habilitado' })
  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled?: boolean = false; // Por defecto deshabilitado

  @ApiPropertyOptional({ description: 'Código de reseteo de contraseña' })
  @IsOptional()
  @IsString()
  passwordResetCode?: string;

  @ApiPropertyOptional({ description: 'Fecha de expiración del código de reseteo' })
  @IsOptional()
  passwordResetCodeExpiresAt?: Date;

  @ApiPropertyOptional({ description: 'Secreto para 2FA' })
  @IsOptional()
  @IsString()
  twoFactorSecret?: string;

  @ApiPropertyOptional({ description: 'Secreto temporal para habilitar 2FA' })
  @IsOptional()
  @IsString()
  temp2FASecret?: string;

  @ApiPropertyOptional({ description: 'Última verificación de 2FA' })
  @IsOptional()
  last2FAVerifiedAt?: Date;

  @ApiPropertyOptional({ description: 'Dispositivos de confianza' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trustedDevices?: string[];
}

// DTO que maneja la conversión de nombres de campos del frontend
export class CreateUserLegacyDto {
  @ApiProperty({ description: 'Nombre del usuario (legacy)' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Apellido del usuario (legacy)' })
  @IsString()
  lastname: string;

  @ApiProperty({ description: 'Rol del usuario (legacy)' })
  @IsArray()
  @IsString({ each: true })
  rol: string[];

  @ApiPropertyOptional({ description: 'ID del rol asignado al usuario' })
  @IsOptional()
  @IsNumber()
  roleId?: number;

  @ApiPropertyOptional({ description: 'ID del departamento asignado al usuario' })
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @ApiProperty({ description: 'Email único del usuario' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Si el usuario está activo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Si el usuario está bloqueado' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ description: 'dias de expiracion de contraseña (legacy)' })
  @IsOptional()
  @IsNumber()
  daysToPasswordExpiration?: number;

  // Método para convertir a UserDto
  toUserDto(): CreateUserDto {
    return {
      firstName: this.name,
      lastName: this.lastname,
      daysToPasswordExpiration: this.daysToPasswordExpiration ?? 90,
      role: Array.isArray(this.rol) ? (this.rol[0] || 'user') : 'user',
      roleId: this.roleId || 11, // ID por defecto del rol "Empleado"
      departmentId: this.departmentId || 1, // ID por defecto del departamento "Administración"
      email: this.email,
      password: this.password,
      active: this.active ?? true,
      isBlocked: this.isBlocked ?? false,
      isTwoFactorEnabled: false
    };
  }
}
