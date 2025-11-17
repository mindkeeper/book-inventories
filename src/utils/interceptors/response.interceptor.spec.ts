import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { TransformResponseInterceptor } from './response.interceptor';
import { responseMessageKey } from '../decorators/response.decorator';

describe('TransformResponseInterceptor', () => {
  let interceptor: TransformResponseInterceptor;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler<Record<string, unknown>>;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new TransformResponseInterceptor(reflector);

    // Mock ExecutionContext
    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToHttp: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as CallHandler<Record<string, unknown>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should be defined', () => {
      expect(interceptor).toBeDefined();
    });

    it('should add default message "Success" when no custom message is set', (done) => {
      const mockData = { id: 1, name: 'Test' };
      const mockHandler = jest.fn().mockReturnValue(of(mockData));
      mockCallHandler.handle = mockHandler;

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as ReturnType<typeof of>;

      result$.subscribe({
        next: (value: Record<string, unknown>) => {
          expect(value).toEqual({
            message: 'Success',
            id: 1,
            name: 'Test',
          });
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(reflector.get).toHaveBeenCalledWith(
            responseMessageKey,
            mockExecutionContext.getHandler(),
          );
          done();
        },
        error: (err: Error) => {
          done(err);
        },
      });
    });

    it('should add custom message when decorator is used', (done) => {
      const customMessage = 'Data retrieved successfully';
      const mockData = { id: 1, name: 'Test' };
      const mockHandler = jest.fn().mockReturnValue(of(mockData));
      mockCallHandler.handle = mockHandler;

      jest.spyOn(reflector, 'get').mockReturnValue(customMessage);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as ReturnType<typeof of>;

      result$.subscribe({
        next: (value: Record<string, unknown>) => {
          expect(value).toEqual({
            message: customMessage,
            id: 1,
            name: 'Test',
          });
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(reflector.get).toHaveBeenCalledWith(
            responseMessageKey,
            mockExecutionContext.getHandler(),
          );
          done();
        },
        error: (err: Error) => {
          done(err);
        },
      });
    });

    it('should handle empty object response', (done) => {
      const mockData = {};
      const mockHandler = jest.fn().mockReturnValue(of(mockData));
      mockCallHandler.handle = mockHandler;

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as ReturnType<typeof of>;

      result$.subscribe({
        next: (value: Record<string, unknown>) => {
          expect(value).toEqual({
            message: 'Success',
          });
          done();
        },
        error: (err: Error) => {
          done(err);
        },
      });
    });

    it('should handle response with nested objects', (done) => {
      const mockData = {
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
        },
        metadata: {
          timestamp: '2024-01-01',
        },
      };
      const mockHandler = jest.fn().mockReturnValue(of(mockData));
      mockCallHandler.handle = mockHandler;

      jest.spyOn(reflector, 'get').mockReturnValue('User data fetched');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as ReturnType<typeof of>;

      result$.subscribe({
        next: (value: Record<string, unknown>) => {
          expect(value).toEqual({
            message: 'User data fetched',
            user: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
            },
            metadata: {
              timestamp: '2024-01-01',
            },
          });
          done();
        },
        error: (err: Error) => {
          done(err);
        },
      });
    });

    it('should handle response with arrays', (done) => {
      const mockData = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        total: 2,
      };
      const mockHandler = jest.fn().mockReturnValue(of(mockData));
      mockCallHandler.handle = mockHandler;

      jest.spyOn(reflector, 'get').mockReturnValue('Items retrieved');

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as ReturnType<typeof of>;

      result$.subscribe({
        next: (value: Record<string, unknown>) => {
          expect(value).toEqual({
            message: 'Items retrieved',
            items: [
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' },
            ],
            total: 2,
          });
          done();
        },
        error: (err: Error) => {
          done(err);
        },
      });
    });

    it('should properly spread all data properties', (done) => {
      const mockData = {
        prop1: 'value1',
        prop2: 'value2',
        prop3: { nested: 'value' },
        prop4: [1, 2, 3],
      };
      const mockHandler = jest.fn().mockReturnValue(of(mockData));
      mockCallHandler.handle = mockHandler;

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as ReturnType<typeof of>;

      result$.subscribe({
        next: (value: Record<string, unknown>) => {
          expect(value).toHaveProperty('message', 'Success');
          expect(value).toHaveProperty('prop1', 'value1');
          expect(value).toHaveProperty('prop2', 'value2');
          expect(value).toHaveProperty('prop3');
          expect(value).toHaveProperty('prop4');
          expect(Object.keys(value)).toHaveLength(5);
          done();
        },
        error: (err: Error) => {
          done(err);
        },
      });
    });

    it('should call next.handle() exactly once', (done) => {
      const mockData = { test: 'data' };
      const mockHandler = jest.fn().mockReturnValue(of(mockData));
      mockCallHandler.handle = mockHandler;

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as ReturnType<typeof of>;

      result$.subscribe({
        next: () => {
          expect(mockHandler).toHaveBeenCalledTimes(1);
          done();
        },
        error: (err: Error) => {
          done(err);
        },
      });
    });

    it('should preserve the Observable stream and not break the chain', (done) => {
      const mockData = { data: 'test' };
      const mockHandler = jest.fn().mockReturnValue(of(mockData));
      mockCallHandler.handle = mockHandler;

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      ) as ReturnType<typeof of>;

      expect(result$).toBeDefined();
      expect(typeof result$.subscribe).toBe('function');

      result$.subscribe({
        next: (value: Record<string, unknown>) => {
          expect(value).toBeDefined();
          done();
        },
        error: (err: Error) => {
          done(err);
        },
      });
    });
  });
});
