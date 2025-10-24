import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { responseMessage } from '../decorators/response.decorator';
import { Request, Response } from 'express';

export interface IResponse<T> {
  status: boolean;
  timestamp: string;
  path: string;
  statusCode: number;
  message: string | { [key: string]: string }[];
  data: T;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, IResponse<T>>
{
  constructor(private reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IResponse<T>> | Promise<Observable<IResponse<T>>> {
    const message =
      this.reflector.get<string>(responseMessage, context.getHandler()) ||
      'Success';

    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => ({
        status: true,
        timestamp: new Date().toISOString(),
        path: request.url,
        statusCode: response.statusCode,
        message,
        data,
      })),
    );
  }
}
