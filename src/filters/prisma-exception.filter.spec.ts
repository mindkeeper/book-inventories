/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaExceptionFilter } from './prisma-exception.filter';
import { Request, Response } from 'express';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let configService: jest.Mocked<ConfigService>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockRequest: Partial<Request>;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaExceptionFilter,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    filter = module.get<PrismaExceptionFilter>(PrismaExceptionFilter);
    configService = module.get(ConfigService);

    mockRequest = {
      url: '/test-endpoint',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle P2002 unique constraint error', () => {
      configService.get.mockReturnValue('development');
      const exception = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['email'],
          },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        message: 'email already exists',
        error: exception.cause,
        data: null,
        stackTrace: expect.any(Array),
      });
    });

    it('should handle P2003 foreign key constraint error', () => {
      configService.get.mockReturnValue('development');
      const exception = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: {
            field_name: 'author_id',
          },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        message: 'undefined foreign key constraint could not be found',
        error: exception.cause,
        data: null,
        stackTrace: expect.any(Array),
      });
    });

    it('should handle P2025 record not found error', () => {
      configService.get.mockReturnValue('development');
      const exception = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
        meta: {
          modelName: 'Book',
        },
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        message: 'Book data not found',
        error: exception.cause,
        data: null,
        stackTrace: expect.any(Array),
      });
    });

    it('should handle unknown Prisma error codes', () => {
      configService.get.mockReturnValue('development');
      const exception = new PrismaClientKnownRequestError('Unknown error', {
        code: 'P9999',
        clientVersion: '5.0.0',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        message: 'Internal server error',
        error: exception.cause,
        data: null,
        stackTrace: expect.any(Array),
      });
    });

    it('should exclude stack trace in production mode', () => {
      configService.get.mockReturnValue('production');
      const exception = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['email'],
          },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('stackTrace');
    });

    it('should include stack trace in development mode', () => {
      configService.get.mockReturnValue('development');
      const exception = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['email'],
          },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs).toHaveProperty('stackTrace');
    });

    it('should generate proper timestamp format', () => {
      configService.get.mockReturnValue('development');
      const exception = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['email'],
          },
        },
      );
      const beforeCall = new Date().toISOString();

      filter.catch(exception, mockArgumentsHost);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const afterCall = new Date().toISOString();

      expect(callArgs.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(callArgs.timestamp >= beforeCall).toBe(true);
      expect(callArgs.timestamp <= afterCall).toBe(true);
    });

    it('should use correct request URL in response', () => {
      configService.get.mockReturnValue('development');
      mockRequest.url = '/custom/prisma-path';
      const exception = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['email'],
          },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.path).toBe('/custom/prisma-path');
    });

    it('should check NODE_ENV configuration', () => {
      configService.get.mockReturnValue('production');
      const exception = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['email'],
          },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });
  });
});
