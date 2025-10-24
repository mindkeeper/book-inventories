/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { ZodError, ZodIssue } from 'zod';
import { ZodExceptionFilter } from './zod-exception.filter';
import { Request, Response } from 'express';

describe('ZodExceptionFilter', () => {
  let filter: ZodExceptionFilter;
  let configService: jest.Mocked<ConfigService>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockRequest: Partial<Request>;
  let mockResponse: jest.Mocked<Response>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockRequest = {
      url: '/test-endpoint',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Response>;

    configService = {
      get: jest.fn(),
    } as any;

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZodExceptionFilter,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    filter = module.get<ZodExceptionFilter>(ZodExceptionFilter);
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle single Zod validation issue in development mode', () => {
      configService.get.mockReturnValue('development');
      const issues: ZodIssue[] = [
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['name'],
          message: 'Expected string, received number',
        } as any,
      ];
      const exception = new ZodError(issues);
      exception.stack = 'Test stack trace';

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Validation Error'),
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        message: 'Validation failed',
        data: null,
        errors: [
          {
            path: 'name',
            message: 'Expected string, received number',
          },
        ],
        stack: expect.any(String),
      });
    });

    it('should handle multiple Zod validation issues in production mode', () => {
      configService.get.mockReturnValue('production');
      const issues: ZodIssue[] = [
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['name'],
          message: 'Expected string, received number',
        } as any,
        {
          code: 'too_small',
          minimum: 1,
          inclusive: true,
          exact: false,
          path: ['email'],
          message: 'String must contain at least 1 character(s)',
        } as any,
      ];
      const exception = new ZodError(issues);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        message: 'Validation failed',
        data: null,
        errors: [
          {
            path: 'name',
            message: 'Expected string, received number',
          },
          {
            path: 'email',
            message: 'String must contain at least 1 character(s)',
          },
        ],
      });
    });

    it('should handle nested path validation issues', () => {
      configService.get.mockReturnValue('development');
      const issues: ZodIssue[] = [
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['user', 'profile', 'name'],
          message: 'Expected string, received number',
        } as any,
      ];
      const exception = new ZodError(issues);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: [
            {
              path: 'user.profile.name',
              message: 'Expected string, received number',
            },
          ],
        }),
      );
    });

    it('should handle array-indexed path validation issues', () => {
      configService.get.mockReturnValue('development');
      const issues: ZodIssue[] = [
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['items', 0, 'name'],
          message: 'Expected string, received number',
        } as any,
      ];
      const exception = new ZodError(issues);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: [
            {
              path: 'items.0.name',
              message: 'Expected string, received number',
            },
          ],
        }),
      );
    });

    it('should exclude stack trace in production mode', () => {
      configService.get.mockReturnValue('production');
      const issues: ZodIssue[] = [
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['name'],
          message: 'Expected string, received number',
        } as any,
      ];
      const exception = new ZodError(issues);

      filter.catch(exception, mockArgumentsHost);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('stack');
    });

    it('should include stack trace in development mode', () => {
      configService.get.mockReturnValue('development');
      const issues: ZodIssue[] = [
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['name'],
          message: 'Expected string, received number',
        } as any,
      ];
      const exception = new ZodError(issues);

      filter.catch(exception, mockArgumentsHost);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs).toHaveProperty('stack');
    });

    it('should generate proper timestamp format', () => {
      configService.get.mockReturnValue('development');
      const issues: ZodIssue[] = [
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['name'],
          message: 'Expected string, received number',
        } as any,
      ];
      const exception = new ZodError(issues);
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
      mockRequest.url = '/custom/validation-path';
      const issues: ZodIssue[] = [
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['name'],
          message: 'Expected string, received number',
        } as any,
      ];
      const exception = new ZodError(issues);

      filter.catch(exception, mockArgumentsHost);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.path).toBe('/custom/validation-path');
    });

    it('should check NODE_ENV configuration', () => {
      configService.get.mockReturnValue('production');
      const issues: ZodIssue[] = [
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['name'],
          message: 'Expected string, received number',
        } as any,
      ];
      const exception = new ZodError(issues);

      filter.catch(exception, mockArgumentsHost);

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });
  });
});
