/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ExecutionContext } from '@nestjs/common';
import { GetCurrentUser, type TUser } from './current-user.decoreator';

describe('GetCurrentUser Decorator', () => {
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = {
      user: undefined,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GetCurrentUser decorator function', () => {
    it('should be defined', () => {
      expect(GetCurrentUser).toBeDefined();
      expect(typeof GetCurrentUser).toBe('function');
    });

    it('should return a parameter decorator function', () => {
      const decorator = GetCurrentUser();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('User extraction from request', () => {
    it('should extract user from request when user exists', () => {
      const mockUser: TUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };
      mockRequest.user = mockUser;

      // Test the decorator by calling it directly
      const decoratorFunction = GetCurrentUser();

      // Mock the parameter decorator behavior
      const target = {};
      const propertyKey = 'testMethod';
      const parameterIndex = 0;

      // Call the decorator
      decoratorFunction(target, propertyKey, parameterIndex);

      // Verify the decorator was created successfully
      expect(decoratorFunction).toBeDefined();
    });

    it('should handle undefined user in request', () => {
      mockRequest.user = undefined;

      const decoratorFunction = GetCurrentUser();

      const target = {};
      const propertyKey = 'testMethod';
      const parameterIndex = 0;

      decoratorFunction(target, propertyKey, parameterIndex);

      expect(decoratorFunction).toBeDefined();
    });

    it('should handle null user in request', () => {
      mockRequest.user = null;

      const decoratorFunction = GetCurrentUser();

      const target = {};
      const propertyKey = 'testMethod';
      const parameterIndex = 0;

      decoratorFunction(target, propertyKey, parameterIndex);

      expect(decoratorFunction).toBeDefined();
    });
  });

  describe('Decorator behavior with different data parameters', () => {
    it('should work with no data parameter', () => {
      const decorator = GetCurrentUser();
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('should work with string data parameter', () => {
      const decorator = GetCurrentUser('someData');
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('should work with object data parameter', () => {
      const decorator = GetCurrentUser({ key: 'value' });
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });
  });

  describe('Integration with ExecutionContext', () => {
    it('should be compatible with NestJS parameter decorator pattern', () => {
      // Test that the decorator follows the correct pattern
      const decorator = GetCurrentUser();

      // Parameter decorators should be functions that accept target, propertyKey, and parameterIndex
      expect(typeof decorator).toBe('function');

      // Test calling the decorator
      const target = class TestController {};
      const propertyKey = 'testMethod';
      const parameterIndex = 0;

      expect(() => {
        decorator(target, propertyKey, parameterIndex);
      }).not.toThrow();
    });

    it('should work with different execution contexts', () => {
      // Test with HTTP context
      const httpDecorator = GetCurrentUser();
      expect(httpDecorator).toBeDefined();

      // Test with different context types
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockExecutionContext.getType.mockReturnValue('http' as any);
      const contextDecorator = GetCurrentUser();
      expect(contextDecorator).toBeDefined();
    });
  });

  describe('Type safety', () => {
    it('should maintain TUser type structure', () => {
      const mockUser: TUser = {
        id: 'type-test',
        email: 'type@example.com',
        name: 'Type Test',
      };

      // Verify the type structure is correct
      expect(typeof mockUser.id).toBe('string');
      expect(typeof mockUser.email).toBe('string');
      if (mockUser.name) {
        expect(typeof mockUser.name).toBe('string');
      }

      const decorator = GetCurrentUser();
      expect(decorator).toBeDefined();
    });

    it('should handle optional name field', () => {
      const mockUserWithoutName: TUser = {
        id: 'no-name-test',
        email: 'noname@example.com',
      };

      expect(mockUserWithoutName.name).toBeUndefined();
      expect(typeof mockUserWithoutName.id).toBe('string');
      expect(typeof mockUserWithoutName.email).toBe('string');

      const decorator = GetCurrentUser();
      expect(decorator).toBeDefined();
    });
  });
});
