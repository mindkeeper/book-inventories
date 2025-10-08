import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);
  constructor(private configService: ConfigService) {}

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response: Response = context.getResponse();
    const request: Request = context.getRequest();

    let status: number;
    let message: string;
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `${(exception.meta?.target as string[])[0]} already exists`;
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = `${exception.meta?.modelName as string} foreign key constraint could not be found`;
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = `${exception?.meta?.modelName as string} data not found`;
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
        break;
    }

    this.logger.error(
      `Prisma Exception: ${exception.code} - ${exception.message} ${exception.stack}`,
    );

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: exception.cause,
      data: null,
      stackTrace: exception.stack?.split('\n'),
    };

    if (isProduction) delete errorResponse.stackTrace;
    response.status(status).json(errorResponse);
  }
}
