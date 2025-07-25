import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './Dto/user-login.dto';
import { Verify2FADto } from './Dto/verify-2fa.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: UserLoginDto) {
    const user = await this.authService.validateUser(signInDto.email, signInDto.pass);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Si el usuario tiene 2FA habilitado, no generamos el token aún
    if (user.isTwoFactorEnabled) {
      return { requires2FA: true, userId: user.id };
    }

    return this.authService.generateToken(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify')
  async verify2FA(@Body() dto: Verify2FADto) {
    const user = await this.authService.findById(dto.userId);

    if (!user || !user.isTwoFactorEnabled) {
      throw new UnauthorizedException('2FA no habilitado para este usuario');
    }

    const isValid = await this.authService.verify2FA(user, dto.token);
    if (!isValid) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    return this.authService.generateToken(user);
  }
}
