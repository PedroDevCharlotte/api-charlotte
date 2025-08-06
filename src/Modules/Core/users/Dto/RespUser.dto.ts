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
}

export class ReqDeleteUserDto {
  @ApiProperty()
  id: number;
}
