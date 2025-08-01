import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsArray } from 'class-validator';
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

  @ApiProperty({ description: 'Rol del usuario' })
  @IsString()
  @Transform(({ obj }) => {
    if (Array.isArray(obj.rol)) {
      return obj.rol[0] || 'user'; // Tomar el primer elemento del array o 'user' por defecto
    }
    return obj.role || obj.rol || 'user';
  })
  role: string;

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
  isActive?: boolean = true; // Por defecto activo

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
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Si el usuario está bloqueado' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  // Método para convertir a UserDto
  toUserDto(): CreateUserDto {
    return {
      firstName: this.name,
      lastName: this.lastname,
      role: Array.isArray(this.rol) ? (this.rol[0] || 'user') : 'user',
      email: this.email,
      password: this.password,
      isActive: this.isActive ?? true,
      isBlocked: this.isBlocked ?? false,
      isTwoFactorEnabled: false
    };
  }
}
