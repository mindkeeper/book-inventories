/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import {
  ArgumentsHost,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { Request, Response } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let configService: jest.Mocked<ConfigService>;
  let httpAdapterHost: jest.Mocked<HttpAdapterHost>;
  let mockHttpAdapter: jest.Mock;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockHttpAdapter = jest.fn();
    configService = {
      get: jest.fn(),
    } as any;

    httpAdapterHost = {
      httpAdapter: {
        reply: mockHttpAdapter,
      },
    } as any;

    mockRequest = {
      url: '/test-endpoint',
    };

    mockResponse = {};

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: HttpAdapterHost,
          useValue: httpAdapterHost,
        },
      ],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle BadRequestException in development mode', () => {
      configService.get.mockReturnValue('development');
      const exception = new BadRequestException('Invalid input data');
      exception.stack = 'Test stack trace';

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Invalid input data Test stack trace',
        'Test stack trace',
      );

      expect(mockHttpAdapter).toHaveBeenCalledWith(
        mockResponse,
        {
          status: false,
          timestamp: expect.any(String),
          path: '/test-endpoint',
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid input data',
          data: null,
          stack: 'Test stack trace',
        },
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should handle NotFoundException in production mode', () => {
      configService.get.mockReturnValue('production');
      const exception = new NotFoundException('Resource not found');
      exception.stack = 'Test stack trace';

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Resource not found Test stack trace',
        'Test stack trace',
      );

      expect(mockHttpAdapter).toHaveBeenCalledWith(
        mockResponse,
        {
          status: false,
          timestamp: expect.any(String),
          path: '/test-endpoint',
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          data: null,
        },
        HttpStatus.NOT_FOUND,
      );
    });

    it('should handle InternalServerErrorException', () => {
      configService.get.mockReturnValue('development');
      const exception = new InternalServerErrorException('Server error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockHttpAdapter).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Server error',
        }),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should exclude stack trace in production mode', () => {
      configService.get.mockReturnValue('production');
      const exception = new BadRequestException('Test error');
      exception.stack = 'Test stack trace';

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockHttpAdapter.mock.calls[0];
      const responseBody = callArgs[1];

      expect(responseBody).not.toHaveProperty('stack');
    });

    it('should include stack trace in development mode', () => {
      configService.get.mockReturnValue('development');
      const exception = new BadRequestException('Test error');
      exception.stack = 'Test stack trace';

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockHttpAdapter.mock.calls[0];
      const responseBody = callArgs[1];

      expect(responseBody.stack).toBe('Test stack trace');
    });

    it('should handle exception without stack trace', () => {
      configService.get.mockReturnValue('development');
      const exception = new BadRequestException('Test error');
      delete exception.stack;

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Test error No stack trace available',
        'No stack trace available',
      );
    });

    it('should generate proper timestamp format', () => {
      configService.get.mockReturnValue('development');
      const exception = new BadRequestException('Test error');
      const beforeCall = new Date().toISOString();

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockHttpAdapter.mock.calls[0];
      const responseBody = callArgs[1];
      const afterCall = new Date().toISOString();

      expect(responseBody.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(responseBody.timestamp >= beforeCall).toBe(true);
      expect(responseBody.timestamp <= afterCall).toBe(true);
    });

    it('should use correct request URL in response', () => {
      configService.get.mockReturnValue('development');
      mockRequest.url = '/custom/path';
      const exception = new BadRequestException('Test error');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockHttpAdapter.mock.calls[0];
      const responseBody = callArgs[1];

      expect(responseBody.path).toBe('/custom/path');
    });

    it('should check NODE_ENV configuration', () => {
      configService.get.mockReturnValue('production');
      const exception = new BadRequestException('Test error');

      filter.catch(exception, mockArgumentsHost);

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });
  });
});
