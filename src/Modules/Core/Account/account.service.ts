import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { log } from 'console';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}
  
  async getAccountDetails(token: string): Promise<any> {
    // Aquí podrías agregar lógica para decodificar el token y obtener los detalles de la cuenta
    // Por ejemplo, usando JwtService para verificar el token y extraer el payload
    try {
      const decoded = this.jwtService.verify(token);
      console.log('Decoded token:', decoded);
      console.log('User ID from token:', decoded.sub);
      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException('Token inválido o expirado');
      }
      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      const response = await this.authService.generateToken(user.id, true);
      return response;
    } catch (error) {

      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
 
}
