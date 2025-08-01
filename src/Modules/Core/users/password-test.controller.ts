import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Password Reset Test')
@Controller('password-test')
export class PasswordTestController {
  constructor(private readonly usersService: UsersService) {}

  @Get('check-reset-status')
  @ApiOperation({ summary: 'Verificar estado de código de reset' })
  @ApiQuery({ name: 'email', description: 'Email del usuario', example: 'usuario@charlotte.com.mx' })
  async checkResetStatus(@Query('email') email: string) {
    try {
      const user = await this.usersService.findOne(email);
      
      if (!user) {
        return {
          message: 'Usuario no encontrado',
          hasActiveCode: false
        };
      }

      const hasActiveCode = user.passwordResetCode && 
                           user.passwordResetCodeExpiresAt && 
                           new Date() < user.passwordResetCodeExpiresAt;

      return {
        message: 'Estado verificado',
        hasActiveCode,
        codeExpiresAt: user.passwordResetCodeExpiresAt,
        email: user.email
      };
    } catch (error) {
      return {
        message: 'Error al verificar estado',
        error: error.message
      };
    }
  }
}
