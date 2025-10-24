/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, Observable } from 'rxjs';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import {
  TransformResponseInterceptor,
  IResponse,
} from './response.interceptor';
import { responseMessage } from '../decorators/response.decorator';

describe('TransformResponseInterceptor', () => {
  let interceptor: TransformResponseInterceptor<any>;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransformResponseInterceptor,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<TransformResponseInterceptor<any>>(
      TransformResponseInterceptor,
    );
    reflector = module.get<Reflector>(Reflector);

    // Mock Request and Response objects
    mockRequest = {
      url: '/api/test',
      method: 'GET',
      headers: {},
    };

    mockResponse = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should be an instance of TransformResponseInterceptor', () => {
      expect(interceptor).toBeInstanceOf(TransformResponseInterceptor);
    });

    it('should have intercept method', () => {
      expect(interceptor.intercept).toBeDefined();
      expect(typeof interceptor.intercept).toBe('function');
    });
  });

  describe('Response Transformation', () => {
    it('should transform response with default success message', async () => {
      const testData = { id: 1, name: 'Test User' };

      // Mock reflector to return undefined (no custom message)
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      // Mock call handler to return test data
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      // Mock Date.now for consistent timestamp
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<typeof testData>>;

      // Convert observable to promise for testing
      const response = await firstValueFrom(result);

      expect(response).toEqual({
        status: true,
        timestamp: mockDate.toISOString(),
        path: '/api/test',
        statusCode: 200,
        message: 'Success',
        data: testData,
      });

      // Verify reflector was called correctly
      expect(reflector.get).toHaveBeenCalledWith(
        responseMessage,
        mockExecutionContext.getHandler(),
      );
    });

    it('should transform response with custom message from decorator', async () => {
      const testData = { message: 'Operation completed' };
      const customMessage = 'User created successfully';

      // Mock reflector to return custom message
      jest.spyOn(reflector, 'get').mockReturnValue(customMessage);

      // Mock call handler to return test data
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<typeof testData>>;
      const response = await firstValueFrom(result);

      expect(response.message).toBe(customMessage);
      expect(response.data).toEqual(testData);
      expect(response.status).toBe(true);
    });

    it('should handle null data', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(null));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<null>>;
      const response = await firstValueFrom(result);

      expect(response.data).toBeNull();
      expect(response.status).toBe(true);
      expect(response.message).toBe('Success');
    });

    it('should handle undefined data', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(undefined));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<undefined>>;
      const response = await firstValueFrom(result);

      expect(response.data).toBeUndefined();
      expect(response.status).toBe(true);
      expect(response.message).toBe('Success');
    });

    it('should handle empty object data', async () => {
      const emptyData = {};
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(emptyData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<typeof emptyData>>;
      const response = await firstValueFrom(result);

      expect(response.data).toEqual({});
      expect(response.status).toBe(true);
    });

    it('should handle array data', async () => {
      const arrayData = [{ id: 1 }, { id: 2 }, { id: 3 }];
      jest
        .spyOn(reflector, 'get')
        .mockReturnValue('Users retrieved successfully');
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(arrayData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<typeof arrayData>>;
      const response = await firstValueFrom(result);

      expect(response.data).toEqual(arrayData);
      expect(response.message).toBe('Users retrieved successfully');
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Response Structure', () => {
    it('should have correct response structure', async () => {
      const testData = { test: 'data' };
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<typeof testData>>;
      const response = await firstValueFrom(result);

      // Check all required properties exist
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('path');
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('data');

      // Check property types
      expect(typeof response.status).toBe('boolean');
      expect(typeof response.timestamp).toBe('string');
      expect(typeof response.path).toBe('string');
      expect(typeof response.statusCode).toBe('number');
      expect(typeof response.message).toBe('string');
    });

    it('should always set status to true for successful responses', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of('any data'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<string>>;
      const response = await firstValueFrom(result);

      expect(response.status).toBe(true);
    });

    it('should include valid ISO timestamp', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({}));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<object>>;
      const response = await firstValueFrom(result);

      // Check if timestamp is a valid ISO string
      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(new Date(response.timestamp).toISOString()).toBe(
        response.timestamp,
      );
    });
  });

  describe('HTTP Context Handling', () => {
    it('should extract correct path from request', async () => {
      const customPath = '/api/users/123';
      mockRequest.url = customPath;

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({}));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<object>>;
      const response = await firstValueFrom(result);

      expect(response.path).toBe(customPath);
    });

    it('should extract correct status code from response', async () => {
      const customStatusCode = 201;
      mockResponse.statusCode = customStatusCode;

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({}));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<object>>;
      const response = await firstValueFrom(result);

      expect(response.statusCode).toBe(customStatusCode);
    });

    it('should handle different HTTP methods', async () => {
      const testCases = [
        { method: 'GET', path: '/api/users' },
        { method: 'POST', path: '/api/users' },
        { method: 'PUT', path: '/api/users/1' },
        { method: 'DELETE', path: '/api/users/1' },
        { method: 'PATCH', path: '/api/users/1' },
      ];

      for (const testCase of testCases) {
        mockRequest.method = testCase.method;
        mockRequest.url = testCase.path;

        jest.spyOn(reflector, 'get').mockReturnValue(undefined);
        jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({}));

        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        ) as Observable<IResponse<object>>;
        const response = await firstValueFrom(result);

        expect(response.path).toBe(testCase.path);
      }
    });
  });

  describe('Message Handling', () => {
    it('should use default message when decorator returns empty string', async () => {
      // When decorator returns empty string, interceptor should use default 'Success'
      jest.spyOn(reflector, 'get').mockReturnValue('');
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({}));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<object>>;
      const response = await firstValueFrom(result);

      // The interceptor uses || 'Success', so empty string will fallback to 'Success'
      expect(response.message).toBe('Success');
    });

    it('should handle long custom messages', async () => {
      const longMessage =
        'This is a very long success message that contains multiple words and should be handled correctly by the interceptor';
      jest.spyOn(reflector, 'get').mockReturnValue(longMessage);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({}));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<object>>;
      const response = await firstValueFrom(result);

      expect(response.message).toBe(longMessage);
    });

    it('should handle messages with special characters', async () => {
      const specialMessage = 'Success! ✅ Operation completed 🎉';
      jest.spyOn(reflector, 'get').mockReturnValue(specialMessage);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({}));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<object>>;
      const response = await firstValueFrom(result);

      expect(response.message).toBe(specialMessage);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for generic data', async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const userData: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      jest.spyOn(reflector, 'get').mockReturnValue('User retrieved');
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(userData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as Observable<IResponse<User>>;
      const response = await firstValueFrom(result);

      expect(response.data.id).toBe(1);
      expect(response.data.name).toBe('John Doe');
      expect(response.data.email).toBe('john@example.com');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle when reflector throws error', () => {
      jest.spyOn(reflector, 'get').mockImplementation(() => {
        throw new Error('Reflector error');
      });
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({}));

      // The interceptor should handle this gracefully or let it bubble up
      expect(() => {
        void interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow('Reflector error');
    });

    it('should handle when request or response is missing properties', async () => {
      // Test with missing url property
      const incompleteRequest = { method: 'GET' };
      const incompleteResponse = {};

      const incompleteContext = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(incompleteRequest),
          getResponse: jest.fn().mockReturnValue(incompleteResponse),
        }),
      };

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({}));

      const result = interceptor.intercept(
        incompleteContext,
        mockCallHandler,
      ) as Observable<IResponse<object>>;
      const response = await firstValueFrom(result);

      // Should handle gracefully with undefined values
      expect(response.path).toBeUndefined();
      expect(response.statusCode).toBeUndefined();
      expect(response.status).toBe(true);
      expect(response.message).toBe('Success');
    });
  });
});
