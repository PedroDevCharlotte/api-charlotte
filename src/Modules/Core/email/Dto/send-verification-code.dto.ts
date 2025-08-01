import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationCodeDto {
  @ApiProperty({
    description: 'Dirección de correo electrónico del destinatario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Código de verificación (6 dígitos)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: 'El código debe ser un texto' })
  @IsNotEmpty({ message: 'El código es requerido' })
  @Length(6, 6, { message: 'El código debe tener exactamente 6 caracteres' })
  @Matches(/^\d{6}$/, { message: 'El código debe contener solo 6 dígitos' })
  code: string;
}
