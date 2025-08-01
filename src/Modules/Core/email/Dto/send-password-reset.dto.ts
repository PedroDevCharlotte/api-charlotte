import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPasswordResetDto {
  @ApiProperty({
    description: 'Dirección de correo electrónico del destinatario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Token de restablecimiento de contraseña',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    minLength: 10,
  })
  @IsString({ message: 'El token debe ser un texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  @MinLength(10, { message: 'El token debe tener al menos 10 caracteres' })
  token: string;
}
