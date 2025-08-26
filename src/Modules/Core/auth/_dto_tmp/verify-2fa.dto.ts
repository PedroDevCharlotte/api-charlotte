import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class Verify2FADto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Token de 2FA de 6 dígitos' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ description: 'Valor opcional para indicar el origen de la solicitud' })
  @IsBoolean()
  from?: boolean;
}

export class setup2FADto {
  @ApiProperty({ description: 'ID del usuario para configurar 2FA' })
  @IsNumber()
  userId: number;
}
