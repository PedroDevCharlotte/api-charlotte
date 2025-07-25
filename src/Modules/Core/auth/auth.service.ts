import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Validación de usuario y contraseña
  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findOne(email);
    const isPasswordValid = user && await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) return null;
    return user;
  }

  // Generación del token JWT
  async generateToken(user: any): Promise<{ access_token: string }> {
    const payload = { sub: user.userId, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  // Verificación del código TOTP
  async verify2FA(user: any, token: string): Promise<boolean> {
    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  // Buscar usuario por ID
  async findById(id: number) {
    return this.usersService.findById(id);
  }
}
