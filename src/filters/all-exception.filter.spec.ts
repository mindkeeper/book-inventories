/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpAdapterHost } from '@nestjs/core';
import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { AllExceptionFilter } from './all-exception.filter';
import { Request, Response } from 'express';

describe('AllExceptionFilter', () => {
  let filter: AllExceptionFilter;
  let httpAdapterHost: jest.Mocked<HttpAdapterHost>;
  let mockHttpAdapter: jest.Mock;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockHttpAdapter = jest.fn();
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
        AllExceptionFilter,
        {
          provide: HttpAdapterHost,
          useValue: httpAdapterHost,
        },
      ],
    }).compile();

    filter = module.get<AllExceptionFilter>(AllExceptionFilter);
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle Error instances correctly', () => {
      const error = new Error('Test error message');
      error.stack = 'Test stack trace';

      filter.catch(error, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Exception: Test error message, Status: 500, Stack: Test stack trace',
      );

      expect(mockHttpAdapter).toHaveBeenCalledWith(
        mockResponse,
        {
          status: false,
          timestamp: expect.any(String),
          path: '/test-endpoint',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Test error message',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should handle string exceptions', () => {
      const stringError = 'String error message';

      filter.catch(stringError, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Exception: String error message, Status: 500, Stack: No stack trace available',
      );

      expect(mockHttpAdapter).toHaveBeenCalledWith(
        mockResponse,
        {
          status: false,
          timestamp: expect.any(String),
          path: '/test-endpoint',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'String error message',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should handle object exceptions with message property', () => {
      const objectError = { message: 'Object error message' };

      filter.catch(objectError, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Exception: Object error message, Status: 500, Stack: No stack trace available',
      );

      expect(mockHttpAdapter).toHaveBeenCalledWith(
        mockResponse,
        {
          status: false,
          timestamp: expect.any(String),
          path: '/test-endpoint',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Object error message',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should handle unknown exception types', () => {
      const unknownError = 123;

      filter.catch(unknownError, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Exception: Unknown error occurred, Status: 500, Stack: No stack trace available',
      );

      expect(mockHttpAdapter).toHaveBeenCalledWith(
        mockResponse,
        {
          status: false,
          timestamp: expect.any(String),
          path: '/test-endpoint',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Unknown error occurred',
          data: null,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should handle Error without stack trace', () => {
      const error = new Error('Error without stack');
      delete error.stack;

      filter.catch(error, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Exception: Error without stack, Status: 500, Stack: No stack trace available',
      );
    });

    it('should generate proper timestamp format', () => {
      const error = new Error('Test error');
      const beforeCall = new Date().toISOString();

      filter.catch(error, mockArgumentsHost);

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
      mockRequest.url = '/custom/path';
      const error = new Error('Test error');

      filter.catch(error, mockArgumentsHost);

      const callArgs = mockHttpAdapter.mock.calls[0];
      const responseBody = callArgs[1];

      expect(responseBody.path).toBe('/custom/path');
    });
  });

  describe('getExceptionMessage', () => {
    it('should extract message from Error instances', () => {
      const error = new Error('Error message');
      const result = (filter as any).getExceptionMessage(error);
      expect(result).toBe('Error message');
    });

    it('should handle string exceptions', () => {
      const result = (filter as any).getExceptionMessage('String error');
      expect(result).toBe('String error');
    });

    it('should extract message from objects with message property', () => {
      const obj = { message: 'Object message' };
      const result = (filter as any).getExceptionMessage(obj);
      expect(result).toBe('Object message');
    });

    it('should return default message for unknown types', () => {
      const result = (filter as any).getExceptionMessage(null);
      expect(result).toBe('Unknown error occurred');
    });
  });

  describe('getExceptionStack', () => {
    it('should extract stack from Error instances', () => {
      const error = new Error('Test error');
      error.stack = 'Test stack trace';
      const result = (filter as any).getExceptionStack(error);
      expect(result).toBe('Test stack trace');
    });

    it('should return default message when no stack is available', () => {
      const error = new Error('Test error');
      delete error.stack;
      const result = (filter as any).getExceptionStack(error);
      expect(result).toBe('No stack trace available');
    });

    it('should return default message for non-Error types', () => {
      const result = (filter as any).getExceptionStack('string error');
      expect(result).toBe('No stack trace available');
    });
  });
});
