import {
  type ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { Request, Response } from 'express';

type TResponse<T> = {
  status: boolean;
  timestamp: string;
  path: string;
  statusCode: number;
  message: string;
  data: T;
};

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);
  constructor(private httpAdapterHost: HttpAdapterHost) {}

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    // Safe access to exception properties
    const exceptionMessage = this.getExceptionMessage(exception);
    const exceptionStack = this.getExceptionStack(exception);

    this.logger.error(
      `Exception: ${exceptionMessage}, Status: ${status}, Stack: ${exceptionStack}`,
    );

    const responseBody: TResponse<null> = {
      status: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      statusCode: status,
      message: exceptionMessage,
      data: null,
    };
    httpAdapter.reply(response, responseBody, status);
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
