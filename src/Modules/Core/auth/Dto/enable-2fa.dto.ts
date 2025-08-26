import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsString, IsOptional } from "class-validator";

export class Enable2FADto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Token de 6 dígitos del autenticador' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ description: 'Secreto de 2FA (opcional)' })
  @IsOptional()
  @IsString()
  twoFactorSecret?: string;

  @ApiPropertyOptional({ description: 'Secreto temporal de 2FA (opcional)' })
  @IsOptional()
  @IsString()
  temp2FASecret?: string;
}
