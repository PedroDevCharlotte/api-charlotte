import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ChangeFirstPasswordDto {
  @ApiProperty({
    description: 'Contraseña actual del usuario',
    example: 'contraseñaActual123',
    minLength: 1
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña del usuario',
    example: 'nuevaContraseña456',
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @IsNotEmpty()
  newPassword: string;
}
