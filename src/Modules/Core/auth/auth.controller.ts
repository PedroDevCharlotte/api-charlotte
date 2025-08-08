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
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './Dto/user-login.dto';
import { LoginResponseDto } from './Dto/login-response.dto';
import { setup2FADto, Verify2FADto } from './Dto/verify-2fa.dto';
import { Enable2FADto } from './Dto/enable-2fa.dto';
import { ChangeFirstPasswordDto } from './Dto/change-first-password.dto';
import { AuthGuard } from './../../../Common/Auth/auth.guard';
import { ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AuditService } from '../audit/audit.service';
import * as qrcode from 'qrcode';
import { resolve, join } from 'path';
import { JwtService } from '@nestjs/jwt';
import * as sharp from 'sharp';
@ApiBearerAuth('Token')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private auditService: AuditService
  ) {}

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
  async signIn(@Body() signInDto: UserLoginDto, @Request() req: any): Promise<LoginResponseDto> {

    const user = await this.authService.validateUser(
      signInDto.email,
      signInDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokenResponse = await this.authService.generateToken(user.id, true);

    // Registrar el inicio de sesión solo si no requiere 2FA (autenticación completada)
    if (!tokenResponse.requires2FA) {
      try {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        await this.auditService.logLogin({
          userId: user.id,
          userEmail: user.email,
          sessionToken: tokenResponse.access_token,
          ipAddress,
          userAgent,
          loginMethod: user.isTwoFactorEnabled ? '2FA' : 'PASSWORD',
        });
      } catch (error) {
        console.error('Error registrando sesión de login:', error);
        // No fallar el login por errores de auditoría
      }
    }

    return tokenResponse;
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify')
  async verify2FA(@Body() dto: Verify2FADto, @Request() req: any) {
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

    const tokenResponse = await this.authService.generateToken(user.id, isValid);

    // Registrar el inicio de sesión con 2FA completado
    try {
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      await this.auditService.logLogin({
        userId: user.id,
        userEmail: user.email,
        sessionToken: tokenResponse.access_token,
        ipAddress,
        userAgent,
        loginMethod: '2FA',
      });
    } catch (error) {
      console.error('Error registrando sesión de 2FA:', error);
      // No fallar el login por errores de auditoría
    }

    return tokenResponse;
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
    const { otpauthUrl, secret } = await this.authService.generate2FASecret(user);
    
    // Generar QR personalizado con logo de Charlotte
    const customQrCode = await this.generateCustomQR(otpauthUrl);
    
    return { 
      otpauthUrl, 
      secret, 
      qrCode: customQrCode 
    };
  }

  /**
   * Genera un código QR personalizado con el logo de Charlotte Inc
   */
  private async generateCustomQR(data: string): Promise<string> {
    try {
      // Configuración del QR
      const qrOptions = {
        errorCorrectionLevel: 'H' as const, // Nivel alto de corrección de errores para permitir el logo
        type: 'png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#003366', // Azul corporativo de Charlotte
          light: '#FFFFFF'
        },
        width: 300
      };

      // Generar QR base
      const qrBuffer = await qrcode.toBuffer(data, qrOptions);
      
      // Ruta al logo de Charlotte
      const logoPathPng = join(process.cwd(), 'public', 'images', 'logos', 'Logo azul CCI INTL.png');
      const logoPathJpg = join(process.cwd(), 'public', 'images', 'logos', 'cci-logo-azul.jpg');
      
      try {
        // Intentar cargar el logo
        let logoBuffer;
        try {
          logoBuffer = await sharp(logoPathPng).png().toBuffer();
        } catch (error) {
          console.log('No se pudo cargar el logo PNG, intentando con JPG...');
          logoBuffer = await sharp(logoPathJpg).png().toBuffer();
        }

        // Obtener dimensiones del QR
        const qrImage = sharp(qrBuffer);
        const { width: qrWidth, height: qrHeight } = await qrImage.metadata();
        
        // Calcular tamaño del logo (20% del QR)
        const logoSize = Math.floor((qrWidth || 300) * 0.2);
        
        // Redimensionar logo y crear fondo blanco
        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSize, logoSize)
          .toBuffer();

        // Crear fondo blanco para el logo
        const logoWithBackground = await sharp({
          create: {
            width: logoSize + 20,
            height: logoSize + 20,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
        .composite([{
          input: resizedLogo,
          left: 10,
          top: 10
        }])
        .png()
        .toBuffer();

        // Calcular posición central
        const left = Math.floor(((qrWidth || 300) - (logoSize + 20)) / 2);
        const top = Math.floor(((qrHeight || 300) - (logoSize + 20)) / 2);

        // Combinar QR con logo
        const finalImage = await qrImage
          .composite([{
            input: logoWithBackground,
            left: left,
            top: top
          }])
          .png()
          .toBuffer();

        return `data:image/png;base64,${finalImage.toString('base64')}`;
        
      } catch (logoError) {
        console.log('No se pudo cargar ningún logo, generando QR sin logo:', logoError);
        return `data:image/png;base64,${qrBuffer.toString('base64')}`;
      }
      
    } catch (error) {
      console.error('Error generando QR personalizado:', error);
      // Fallback: generar QR normal si hay error
      return await qrcode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        color: {
          dark: '#003366',
          light: '#FFFFFF'
        },
        width: 300
      });
    }
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
  async disable2FA(@Body() dto: Verify2FADto, @Request() req: any) {
    console.log('Disabling 2FA for user:', dto);
    const user = await this.authService.findById(dto.userId);
    let tokenHeader = '';
    if (dto.from) {
      console.log('From flag is set, using token from header');
      // Extraer y decodificar el token del header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token de autorización requerido');
      }

      tokenHeader = authHeader.substring(7); // Remover 'Bearer '
    }

    const isValid = await this.authService.verify2FA(user, dto.token, tokenHeader);
    if (!isValid) {
      throw new UnauthorizedException('Código 2FA inválido');
    }
    await this.authService.disable2FA(user.id);
    return { message: '2FA deshabilitado correctamente' };
  }

  // Endpoint para cambiar contraseña en el primer login
  @UseGuards(AuthGuard)
  @Post('change-first-password')
  @ApiOperation({ summary: 'Cambiar contraseña en el primer login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraseña cambiada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Contraseña cambiada exitosamente' },
        access_token: { type: 'string', example: 'nuevo.jwt.token' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido, usuario no encontrado, o no es primer login' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Contraseña actual incorrecta o nueva contraseña no válida' 
  })
  async changeFirstPassword(
    @Body() changePasswordDto: ChangeFirstPasswordDto,
    @Req() request: any
  ) {
    try {
      // Extraer y decodificar el token del header Authorization
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token de autorización requerido');
      }

      const token = authHeader.substring(7); // Remover 'Bearer '
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;
      console.log('User ID from token:', userId);
      if (!userId) {
        throw new UnauthorizedException('Token inválido');
      }

      // Cambiar la contraseña
      await this.authService.changeFirstLoginPassword(
        userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword
      );

      // Generar un nuevo token después del cambio de contraseña
      const newTokenData = await this.authService.generateToken(userId, true);

      return {
        message: 'Contraseña cambiada exitosamente',
        access_token: newTokenData.access_token,
        user: newTokenData.user,
        requires2FA: newTokenData.requires2FA,
        register2FA: newTokenData.register2FA,
        isFirstLogin: false // Ya no es primer login
      };

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token inválido');
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado');
      }
      throw error; // Re-lanzar otros errores
    }
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión del usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout exitoso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Sesión cerrada exitosamente' }
      }
    }
  })
  async logout(@Request() req: any) {
    try {
      // Extraer el token del header de autorización
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Registrar el logout
        await this.auditService.logLogout(token, 'MANUAL');
      }

      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      console.error('Error registrando logout:', error);
      // Aún así retornar éxito para el cliente
      return { message: 'Sesión cerrada exitosamente' };
    }
  }
}
