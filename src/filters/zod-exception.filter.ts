/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZodError } from 'zod';

@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ZodExceptionFilter.name);
  constructor(private configService: ConfigService) {}

  catch(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const statusCode = HttpStatus.BAD_REQUEST;
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    this.logger.error(`Validation Error: ${JSON.stringify(exception.issues)}`);
    const errorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      errors: exception.issues.map((error) => ({
        path: error.path.join('.'),
        message: error.message,
      })),
      message: 'Validation failed',
      data: null,
      stack: exception.stack,
    };

    if (isProduction) delete errorResponse['stack'];

    response.status(statusCode).json(errorResponse);
  }
}
