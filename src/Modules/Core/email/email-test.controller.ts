import { Controller, Get, Query } from '@nestjs/common';
import { EmailService } from './email.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Email Test')
@Controller('email-test')
export class EmailTestController {
  constructor(private readonly emailService: EmailService) {}

  @Get('test-connection')
  @ApiOperation({ summary: 'Probar conexión del servicio de email' })
  @ApiQuery({ name: 'email', description: 'Email de prueba', example: 'test@charlotte.com.mx' })
  async testEmailConnection(@Query('email') email: string) {
    try {
      await this.emailService.sendEmail(
        email,
        'Test de conexión - API Charlotte',
        'Este es un email de prueba para validar la configuración.',
        '<h1>Test de conexión exitoso</h1><p>Este es un email de prueba para validar la configuración.</p>'
      );
      
      return {
        success: true,
        message: 'Email de prueba enviado exitosamente',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
