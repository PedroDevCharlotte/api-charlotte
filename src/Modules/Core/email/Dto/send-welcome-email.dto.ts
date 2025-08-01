import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendWelcomeEmailDto {
  @ApiProperty({
    description: 'Dirección de correo electrónico del destinatario',
    example: 'pedro.martinez@charlotte.com.mx',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario para personalizar el email',
    example: 'Pedro Martínez',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;
}
