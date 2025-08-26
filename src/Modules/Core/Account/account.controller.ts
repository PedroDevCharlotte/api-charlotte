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
  ExecutionContext
} from '@nestjs/common';
import { AccountService } from './account.service';

import { Token } from 'src/Common/Decorators/token.decorator';

import { AuthGuard } from './../../../Common/Auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
@ApiBearerAuth('Token')
@Controller('account')
export class AccountController {
  constructor(private accountService: AccountService) {}

  @HttpCode(HttpStatus.OK)
  @Get('me')
  async signIn( @Token() token: string) {
    console.log('Token:', token);
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    // Aquí podrías agregar lógica para validar el token y obtener el usuario
    let response;
    try {
      response = await this.accountService.getAccountDetails(token);
    } catch (error) {
      throw new UnauthorizedException('Error al obtener los detalles de la cuenta');
    }
    return response;
  }

 
}
