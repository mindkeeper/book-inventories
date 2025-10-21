import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';

type TResponse<T> = {
  status: boolean;
  timestamp: string;
  path: string;
  statusCode: number;
  message: string;
  data: T;
  stack?: string;
};
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    private configService: ConfigService,
    private httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;

    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionMessage = this.getExceptionMessage(exception);
    const exceptionStack = this.getExceptionStack(exception);
    statusCode = exception.getStatus();

    this.logger.error(`${exceptionMessage} ${exceptionStack}`, exceptionStack);
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const responseBody: TResponse<null> = {
      status: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      statusCode,
      message: exceptionMessage,
      data: null,
      ...(isProduction ? {} : { stack: exceptionStack }),
    };
    httpAdapter.reply(response, responseBody, statusCode);
  }

  private getExceptionMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }
    if (typeof exception === 'string') {
      return exception;
    }
    if (exception && typeof exception === 'object' && 'message' in exception) {
      return String(exception.message);
    }
    return 'Unknown error occurred';
  }

  private getExceptionStack(exception: unknown): string {
    if (exception instanceof Error && exception.stack) {
      return exception.stack;
    }
    return 'No stack trace available';
  }
}
