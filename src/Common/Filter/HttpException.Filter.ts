import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Environment } from '../Enum/Environment.Enum';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly configService: ConfigService
  ) {}
  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const request = ctx.getRequest<Request>();
    const message = exception.getResponse();

    var objError = {
      error: {
        type: message?.error,
        statusCode: message?.statusCode,
        message: message?.message,
        detail: exception?.stack,
      },
    };

    try {
      
    } catch (error) {
      console.log(error);
    }

    try {
      
    } catch (error) {}

    response.status(status).json(objError);
  }
}
