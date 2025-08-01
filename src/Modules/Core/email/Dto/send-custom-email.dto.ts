import { IsEmail, IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendCustomEmailDto {
  @ApiProperty({
    description: 'Dirección de correo electrónico del destinatario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Asunto del correo electrónico',
    example: 'Notificación importante',
    maxLength: 200,
  })
  @IsString({ message: 'El asunto debe ser un texto' })
  @IsNotEmpty({ message: 'El asunto es requerido' })
  @MaxLength(200, { message: 'El asunto no puede exceder 200 caracteres' })
  subject: string;

  @ApiPropertyOptional({
    description: 'Contenido del email en texto plano',
    example: 'Este es el contenido del mensaje en texto plano.',
  })
  @IsOptional()
  @IsString({ message: 'El contenido en texto debe ser un string' })
  text?: string;

  @ApiPropertyOptional({
    description: 'Contenido del email en HTML',
    example: '<h1>Título</h1><p>Este es el contenido del mensaje en HTML.</p>',
  })
  @IsOptional()
  @IsString({ message: 'El contenido HTML debe ser un string' })
  html?: string;
}
