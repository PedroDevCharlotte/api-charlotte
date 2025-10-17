import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import {
  SendWelcomeEmailDto,
  SendVerificationCodeDto,
  SendPasswordResetDto,
  SendPasswordResetCodeDto,
  SendCustomEmailDto,
  EmailResponseDto,
  EmailErrorResponseDto
} from './Dto'; 

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-welcome')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar email de bienvenida' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email enviado exitosamente',
    type: EmailResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Error en los datos enviados',
    type: EmailErrorResponseDto
  })
  async sendWelcomeEmail(@Body() body: SendWelcomeEmailDto): Promise<EmailResponseDto> {
    await this.emailService.sendWelcomeEmail(body.email, body.name);
    return {
      message: 'Email de bienvenida enviado exitosamente',
      success: true,
      sentAt: new Date().toISOString()
    };
  }

  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar código de verificación' })
  @ApiResponse({ 
    status: 200, 
    description: 'Código de verificación enviado exitosamente',
    type: EmailResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Error en los datos enviados',
    type: EmailErrorResponseDto
  })
  async sendVerificationCode(@Body() body: SendVerificationCodeDto): Promise<EmailResponseDto> {
    await this.emailService.sendVerificationCode(body.email, body.code);
    return {
      message: 'Código de verificación enviado exitosamente',
      success: true,
      sentAt: new Date().toISOString()
    };
  }

  @Post('send-reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar email de restablecimiento de contraseña' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email de restablecimiento enviado exitosamente',
    type: EmailResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Error en los datos enviados',
    type: EmailErrorResponseDto
  })
  async sendPasswordReset(@Body() body: SendPasswordResetDto): Promise<EmailResponseDto> {
    await this.emailService.sendPasswordResetEmail(body.email, body.token);
    return {
      message: 'Email de restablecimiento enviado exitosamente',
      success: true,
      sentAt: new Date().toISOString()
    };
  }

  @Post('send-reset-password-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar código de restablecimiento de contraseña' })
  @ApiResponse({ 
    status: 200, 
    description: 'Código de restablecimiento enviado exitosamente',
    type: EmailResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Error en los datos enviados',
    type: EmailErrorResponseDto
  })
  async sendPasswordResetCode(@Body() body: SendPasswordResetCodeDto): Promise<EmailResponseDto> {
    await this.emailService.sendPasswordResetCode(body.email, body.code, body.userName);
    return {
      message: 'Código de restablecimiento enviado exitosamente',
      success: true,
      sentAt: new Date().toISOString()
    };
  }

  @Post('send-custom')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar email personalizado' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email personalizado enviado exitosamente',
    type: EmailResponseDto
  })
  @ApiBadRequestResponse({  
    description: 'Error en los datos enviados',
    type: EmailErrorResponseDto
  })
  async sendCustomEmail(@Body() body: SendCustomEmailDto): Promise<EmailResponseDto> {
    await this.emailService.sendEmail(body.email, body.subject, body.text, body.html);
    return {
      message: 'Email personalizado enviado exitosamente',
      success: true,
      sentAt: new Date().toISOString()
    };
  }
}
