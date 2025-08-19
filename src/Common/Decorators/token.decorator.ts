import { createParamDecorator, ExecutionContext } from '@nestjs/common';
const jwt = require('jsonwebtoken');

export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    let token: string | undefined;
    let response: any;
    if (data == 'id') {
      if (
        authHeader &&
        typeof authHeader === 'string' &&
        authHeader.startsWith('Bearer ')
      ) {
        token = authHeader.replace('Bearer ', '');
        try {
          response = jwt.decode(token);
        } catch (error) {
          response = undefined;
        }
      }
      return response?.sub;
    } else {
      return (token = authHeader.replace('Bearer ', ''));
    }
  },
);
