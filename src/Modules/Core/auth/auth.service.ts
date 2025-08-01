import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { log } from 'console';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Validación de usuario y contraseña
  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findOne(email);
    const isPasswordValid = user && (await bcrypt.compare(pass, user.password));
    
    // Verificar que el usuario existe, la contraseña es válida y el usuario está activo
    if (!isPasswordValid || !user.active) {
      return null;
    }
    
    return user;
  }

  // Generación del token JWT
  async generateToken(
    userId: number,
    isTwoFactorAuthenticated = false,
  ): Promise<{ access_token: string; requires2FA?: boolean; user?: any; register2FA?: boolean }> {
    let requires2FA = false, register2FA = false;
    const user = await this.findById(userId);
    
    if (user.isTwoFactorEnabled) {
      const lastVerified = user.last2FAVerifiedAt ? new Date(user.last2FAVerifiedAt) : null;
      const now = new Date();
      if (!lastVerified || (now.getTime() - lastVerified.getTime()) > 90 * 24 * 60 * 60 * 1000) {
        requires2FA = true;
      }
    } else {
      register2FA = true;
    }

    const payload = {
      sub: user.id,
      username: user.username,
      isTwoFactorAuthenticated,
    };

    if (!user.isTwoFactorEnabled) {
      payload.isTwoFactorAuthenticated = true;
    }

    return {
      access_token: await this.jwtService.signAsync(payload),
      requires2FA: requires2FA,
      user: {
        id: user.id,
        email: user.email,
        role: user.role?.name || 'Sin rol asignado',
        department: user.department?.name || 'Sin departamento asignado',
        roleId: user.roleId,
        departmentId: user.departmentId,
      },
      register2FA: register2FA,
    };
  }

  // Verificación del código TOTP
  async verify2FA(user: any, token: string): Promise<boolean> {
    var resp;
    try {
      const secretToVerify = user.twoFactorSecret || user.temp2FASecret; 
     

      resp = speakeasy.totp.verify({
        secret: secretToVerify,
        encoding: 'base32',
        token,
        window: 1,
      });

      console.log('2FA verification result:', resp);
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      throw new UnauthorizedException('Invalid 2FA token');
    }

    return resp;
  }

  // Buscar usuario por ID
  async findById(id: number) {
    return this.usersService.findById(id);
  }

  // Generar secreto para 2FA y otpauth_url
  async generate2FASecret(
    user: any,
  ): Promise<{ secret: string; otpauthUrl: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `CharlotteIntranet (${user.email})`,
      length: 20,
    });
    // Aquí podrías guardar el secret en la base de datos si lo necesitas
    await this.usersService.updateTwoFactorSecret(user.id, secret.base32, true);

    const qr = await qrcode.toDataURL(secret.otpauth_url);
    console.log('QR Code generated:', qr);
    // Retornar el secreto y la URL para el QR

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: qr,
    };
  }

  // Habilitar 2FA para un usuario
  async enable2FA(userId: number, secret: string): Promise<void> {
    console.log('Enabling 2FA for user:', userId);
    console.log('2FA secret:', secret);
    await this.usersService.updateTwoFactorSecret(userId, secret, false);
    await this.usersService.enableTwoFactor(userId);
  }

  // Deshabilitar 2FA para un usuario
  async disable2FA(userId: number): Promise<void> {
    await this.usersService.disableTwoFactor(userId);
    // await this.usersService.updateTwoFactorSecret(userId, '', false);
  }

  // Actualiza la fecha y hora de la última verificación 2FA
  async updateLast2FAVerifiedAt(userId: number): Promise<void> {
    const now = new Date();
    await this.usersService.updateLast2FAVerifiedAt(userId, now);
  }
}
