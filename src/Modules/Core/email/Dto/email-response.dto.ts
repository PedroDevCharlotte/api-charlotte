import { ApiProperty } from '@nestjs/swagger';

export class EmailResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Email enviado exitosamente',
  })
  message: string;

  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Timestamp de cuando se envió el email',
    example: '2025-08-01T10:30:00.000Z',
  })
  sentAt: string;
}

export class EmailErrorResponseDto {
  @ApiProperty({
    description: 'Mensaje de error',
    example: 'Error al enviar el email',
  })
  message: string;

  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Código de error',
    example: 'EMAIL_SEND_FAILED',
  })
  errorCode: string;
}
