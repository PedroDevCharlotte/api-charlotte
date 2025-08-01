import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './Dto/user-login.dto';
import { LoginResponseDto } from './Dto/login-response.dto';
import { setup2FADto, Verify2FADto } from './Dto/verify-2fa.dto';
import { Enable2FADto } from './Dto/enable-2fa.dto';
import { AuthGuard } from './../../../Common/Auth/auth.guard';
import { ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import * as qrcode from 'qrcode';
import { resolve } from 'path';
@ApiBearerAuth('Token')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso', 
    type: LoginResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciales inválidas' 
  })
  async signIn(@Body() signInDto: UserLoginDto): Promise<LoginResponseDto> {

    const user = await this.authService.validateUser(
      signInDto.email,
      signInDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.authService.generateToken(user.id, true);
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify')
  async verify2FA(@Body() dto: Verify2FADto) {
    let user = await this.authService.findById(dto.userId);
    if (!user || !user.isTwoFactorEnabled) {
      throw new UnauthorizedException('2FA no habilitado para este usuario');
    }

    const isValid = await this.authService.verify2FA(user, dto.token);
    if (!isValid) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    // Actualiza la fecha de última verificación 2FA
   await this.authService.updateLast2FAVerifiedAt(user.id);

    return this.authService.generateToken(user.id, isValid);
  }

  // Endpoint para generar el secreto y QR para activar 2FA
  @UseGuards(AuthGuard)
  @Post('2fa/setup')
  async setup2FA(@Body() InfoUser: setup2FADto) {
    const user = await this.authService.findById(InfoUser.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    console.log('User found for 2FA setup:', user);
    const { otpauthUrl, secret } =
      await this.authService.generate2FASecret(user);
    return { otpauthUrl, secret, qrCode: await qrcode.toDataURL(otpauthUrl) };
  }

  // Endpoint para habilitar 2FA después de escanear el QR y verificar el código
  @UseGuards(AuthGuard)
  @Post('2fa/enable')
  async enable2FA(@Body() dto: Enable2FADto) {
    let respo = { isError: false, message: '' };

    try {
      console.log('Enabling 2FA for user:', dto);
      const user = await this.authService.findById(dto.userId);
      console.log('User found for enabling 2FA:', user);
      const isValid = await this.authService.verify2FA(user, dto.token);
      if (!isValid) {
        respo.isError = true;
        respo.message = 'Código 2FA inválido';
        throw new UnauthorizedException('Código 2FA inválido');
      }
      await this.authService.enable2FA(user.id, user.temp2FASecret);
      respo.message = '2FA habilitado correctamente';
      let aux = await this.authService.generateToken(user.id, true);
      respo = {...respo, ...aux};
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      respo.isError = true;
      respo.message = 'Error al habilitar 2FA';
    }

    console.log('Response for enable2FA:', respo);

    return respo;
  }

  // Endpoint para deshabilitar 2FA
  @UseGuards(AuthGuard)
  @Post('2fa/disable')
  async disable2FA(@Body() dto: Verify2FADto) {
    const user = await this.authService.findById(dto.userId);
    const isValid = await this.authService.verify2FA(user, dto.token);
    if (!isValid) {
      throw new UnauthorizedException('Código 2FA inválido');
    }
    await this.authService.disable2FA(user.id);
    return { message: '2FA deshabilitado correctamente' };
  }
}
