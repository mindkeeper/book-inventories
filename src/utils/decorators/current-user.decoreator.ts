import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export type TUser = {
  id: number;
  email: string;
  name?: string;
};

export const GetCurrentUser = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.user as TUser;
  },
);
