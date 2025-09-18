import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { log } from 'console';
import { RespTokenDto, userDetails } from './Dto/RespToken.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private rolesService: RolesService,
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
  ): Promise<RespTokenDto> {
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
    // Validar fecha de vencimiento de contraseña y si solicitar reseteo
    let passwordExpired = false;
    let requirePasswordReset = false;

    if (user.dateToPasswordExpiration) {
      const expiresAt = new Date(user.dateToPasswordExpiration);
      const now = new Date();
      if (now > expiresAt) {
        passwordExpired = true;
        requirePasswordReset = true;
      }
    }

    if (passwordExpired) {
      throw new UnauthorizedException('La contraseña ha expirado. Por favor, restablezca su contraseña.');
    }
  
  console.log('Generating token for user:',user.role);
  // Load permissions separately using RolesService to ensure we have modulePath and freshest data
  const roleEntity = user.roleId ? await this.rolesService.getRoleWithPermissionsEntity(user.roleId) : null;
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      requires2FA: requires2FA,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role?.name || 'Sin rol asignado',
        department: user.department?.name || 'Sin departamento asignado',
        roleId: user.roleId,
        departmentId: user.departmentId,
        // Map permissions from Role -> Permission[] to string[] for backward compatibility
        permissions: (roleEntity && Array.isArray(roleEntity.permissions)) ? roleEntity.permissions.map(p => p.name) : [],
        // menus: unique modulePath values from permissions (filter nulls and avoid duplicates)
        menus: (() => {
          const permArr = (roleEntity && Array.isArray(roleEntity.permissions)) ? roleEntity.permissions : [];
          const paths = permArr.map((p:any) => p.modulePath).filter(Boolean);
          return Array.from(new Set(paths));
        })(),
      },
      register2FA: register2FA,
      isFirstLogin: user.isFirstLogin,
    };
  }

  // Verificación del código TOTP
  async verify2FA(user: any, token: string, tokenHeader?: string): Promise<boolean> {
    let resp: boolean;
    try {
      console.log('Verifying 2FA token:', token);
      console.log('User for 2FA verification:', user);
      console.log('From flag:', tokenHeader);

      let secretToVerify = user.twoFactorSecret || user.temp2FASecret;

      if (tokenHeader) {
        const decoded = this.jwtService.decode(tokenHeader) as { sub: number };
        
        if (!decoded || !decoded.sub) {
          throw new UnauthorizedException('Token inválido');
        }
        let userUpdater = await this.usersService.findById(decoded.sub);
        console.log('userUpdater:', userUpdater);

        secretToVerify = userUpdater.twoFactorSecret || userUpdater.temp2FASecret;
      }

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
      name: `Conecta CCI:${user.firstName} ${user.lastName} (${user.email})`,
      label: 'Conecta CCI',
      issuer: 'charlotte.com.mx',
      length: 20,
    }) ;
    // Aquí podrías guardar el secret en la base de datos si lo necesitas
    await this.usersService.updateTwoFactorSecret(user.id, secret.base32, true);
 
    const qr = await qrcode.toDataURL(secret.otpauth_url + '&issuer=charlotte.com.mx');
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

  // Cambiar contraseña en el primer login
  async changeFirstLoginPassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('Operación inválida');
    }

    // Verificar que es primer login
    if (!user.isFirstLogin) {
      throw new UnauthorizedException('Esta operación solo está permitida en el primer login');
    }

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    console.log('Current password is invalid for user: 400 ', userId);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y marcar que ya no es primer login
    await this.usersService.updatePasswordAndFirstLogin(userId, hashedNewPassword);
  }
}
