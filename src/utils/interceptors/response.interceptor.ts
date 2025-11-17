import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { responseMessageKey } from '../decorators/response.decorator';

type IResponse<T extends Record<string, unknown> = Record<string, unknown>> = {
  message: string;
} & T;

@Injectable()
export class TransformResponseInterceptor<
  T extends Record<string, unknown> = Record<string, unknown>,
> implements NestInterceptor<T, IResponse<T>>
{
  constructor(private reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IResponse<T>> | Promise<Observable<IResponse<T>>> {
    const message =
      this.reflector.get<string>(responseMessageKey, context.getHandler()) ||
      'Success';

    return next.handle().pipe(
      map((data) => ({
        message,
        ...data,
      })),
    );
  }
}
