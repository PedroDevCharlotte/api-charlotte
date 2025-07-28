import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    // console.log('Token extracted from header:', request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {

      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      console.log('Payload from token:', payload);

      // Verifica si el usuario pasó 2FA
      if (!payload.isTwoFactorAuthenticated) {
        throw new ForbiddenException('2FA required');
      }

      request['user'] = payload;
    } catch (err) {
      console.log('No token found in request headers');
      console.error('Error verifying token:', err);
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}