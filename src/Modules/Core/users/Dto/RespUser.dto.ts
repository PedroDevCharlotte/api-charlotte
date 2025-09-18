import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class RespUserDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  email: string;
  @ApiPropertyOptional()
  @IsOptional()
  daysToPasswordExpiration: number;
  @ApiPropertyOptional({
    description: 'Rol del usuario (campo legacy, usar roleId)',
  })
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({
    description: 'Departamento del usuario (campo legacy, usar departmentId)',
  })
  @IsOptional()
  department?: string;
  @ApiProperty()
  roleId: number;
  @ApiProperty()
  departmentId: number;
  @ApiProperty()
  isTwoFactorEnabled: boolean;
  @ApiProperty()
  last2FAVerifiedAt?: Date;
  @ApiPropertyOptional()
  isBlocked?: boolean;
  @ApiPropertyOptional()
  active?: boolean;
  @ApiPropertyOptional({ description: 'Emoji generado por el usuario' })
  emoji?: string;
  @ApiPropertyOptional({ description: 'Avatar serializado (JSON or dataURL) disponible en perfil' })
  avatar?: string;
    @ApiPropertyOptional({
      description: 'Tipos de soporte asignados al usuario',
      type: 'array',
      isArray: true,
      example: [{ id: 1, name: 'Soporte' }]
    })
    @IsOptional()
    supportTypes?: { id: number; name: string }[];
  @ApiPropertyOptional({ description: 'ID del jefe directo (manager) del usuario' })
  @IsOptional()
  managerId?: number | null;
}

export class ReqDeleteUserDto {
  @ApiProperty()
  id: number;
}
