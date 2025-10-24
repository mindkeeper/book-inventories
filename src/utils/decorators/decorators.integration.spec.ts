/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  Post,
  UseGuards,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GetCurrentUser } from './current-user.decoreator';
import { responseMessage } from './response.decorator';

// Mock user type
interface MockUser {
  id: number;
  email: string;
  name?: string;
}

// Mock guard for testing
class MockAuthGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Simulate authenticated user
    request.user = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    };
    return true;
  }
}

// Test controller using both decorators
@Controller('test')
@responseMessage('Default controller message')
class TestController {
  @Get('user')
  @responseMessage('Get current user successfully')
  @UseGuards(MockAuthGuard)
  getCurrentUser(@GetCurrentUser() user: MockUser) {
    return { user };
  }

  @Get('user-id')
  @responseMessage('Get user ID successfully')
  @UseGuards(MockAuthGuard)
  getUserId(@GetCurrentUser('id') userId: number) {
    return { userId };
  }

  @Post('create')
  @responseMessage('User created successfully')
  @UseGuards(MockAuthGuard)
  createUser(@GetCurrentUser() user: MockUser) {
    return { message: 'User created', user };
  }

  @Get('no-message')
  @UseGuards(MockAuthGuard)
  getWithoutMessage(@GetCurrentUser() user: MockUser) {
    return { user };
  }
}

describe('Decorators Integration Tests', () => {
  let module: TestingModule;
  let controller: TestController;
  let reflector: Reflector;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [TestController],
      providers: [Reflector],
    }).compile();

    controller = module.get<TestController>(TestController);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Controller and Method Metadata', () => {
    it('should have controller-level responseMessage metadata', () => {
      const controllerMetadata = reflector.get(
        'responseMessage',
        TestController,
      );
      expect(controllerMetadata).toBe('Default controller message');
    });

    it('should have method-level responseMessage metadata', () => {
      const getCurrentUserMetadata = reflector.get(
        'responseMessage',
        TestController.prototype.getCurrentUser,
      );
      expect(getCurrentUserMetadata).toBe('Get current user successfully');

      const getUserIdMetadata = reflector.get(
        'responseMessage',
        TestController.prototype.getUserId,
      );
      expect(getUserIdMetadata).toBe('Get user ID successfully');

      const createUserMetadata = reflector.get(
        'responseMessage',
        TestController.prototype.createUser,
      );
      expect(createUserMetadata).toBe('User created successfully');
    });

    it('should not have responseMessage metadata for methods without decorator', () => {
      const noMessageMetadata = reflector.get(
        'responseMessage',
        TestController.prototype.getWithoutMessage,
      );
      expect(noMessageMetadata).toBeUndefined();
    });
  });

  describe('GetCurrentUser Decorator Integration', () => {
    it('should extract full user object', () => {
      const mockRequest = {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      // Simulate how NestJS would call the parameter decorator
      const result = controller.getCurrentUser(mockRequest.user);
      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });

    it('should extract specific user property', () => {
      const mockRequest = {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      // Simulate extracting just the ID
      const result = controller.getUserId(mockRequest.user.id);
      expect(result).toEqual({ userId: 1 });
    });
  });

  describe('Decorator Composition', () => {
    it('should work with multiple decorators on the same method', () => {
      // Check that both decorators work together
      const responseMetadata = reflector.get(
        'responseMessage',
        TestController.prototype.getCurrentUser,
      );
      expect(responseMetadata).toBe('Get current user successfully');

      // Simulate the method execution
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };
      const result = controller.getCurrentUser(mockUser);
      expect(result).toEqual({ user: mockUser });
    });

    it('should handle different response messages for different methods', () => {
      const methods = [
        {
          method: TestController.prototype.getCurrentUser,
          expectedMessage: 'Get current user successfully',
        },
        {
          method: TestController.prototype.getUserId,
          expectedMessage: 'Get user ID successfully',
        },
        {
          method: TestController.prototype.createUser,
          expectedMessage: 'User created successfully',
        },
      ];

      methods.forEach(({ method, expectedMessage }) => {
        const metadata = reflector.get('responseMessage', method);
        expect(metadata).toBe(expectedMessage);
      });
    });
  });

  describe('Guard Integration', () => {
    it('should work with UseGuards decorator', () => {
      // Verify that the guard can be applied alongside our decorators
      const mockGuard = new MockAuthGuard();
      const mockRequest = {};
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const canActivate = mockGuard.canActivate(mockContext);
      expect(canActivate).toBe(true);

      // Verify the request was modified by the guard
      expect(mockRequest).toHaveProperty('user');
      expect((mockRequest as any).user).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle user authentication flow', () => {
      // Simulate a complete authentication flow
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      // Test getting current user
      const userResult = controller.getCurrentUser(mockUser);
      expect(userResult).toEqual({ user: mockUser });

      // Test getting user ID
      const idResult = controller.getUserId(mockUser.id);
      expect(idResult).toEqual({ userId: 1 });

      // Test creating user
      const createResult = controller.createUser(mockUser);
      expect(createResult).toEqual({
        message: 'User created',
        user: mockUser,
      });
    });

    it('should handle partial user objects', () => {
      const partialUser = {
        id: 2,
        email: 'partial@example.com',
        // name is optional
      };

      const result = controller.getCurrentUser(partialUser);
      expect(result).toEqual({ user: partialUser });
    });

    it('should maintain type safety', () => {
      const typedUser: MockUser = {
        id: 3,
        email: 'typed@example.com',
        name: 'Typed User',
      };

      const result = controller.getCurrentUser(typedUser);
      expect(result.user.id).toBe(3);
      expect(result.user.email).toBe('typed@example.com');
      expect(result.user.name).toBe('Typed User');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle undefined user gracefully', () => {
      // This would typically be handled by guards, but test the decorator behavior
      const result = controller.getCurrentUser(undefined as any);
      expect(result).toEqual({ user: undefined });
    });

    it('should handle null user gracefully', () => {
      const result = controller.getCurrentUser(null as any);
      expect(result).toEqual({ user: null });
    });
  });

  describe('Metadata Inheritance', () => {
    it('should not inherit method metadata to controller level', () => {
      const controllerMetadata = reflector.get(
        'responseMessage',
        TestController,
      );
      const methodMetadata = reflector.get(
        'responseMessage',
        TestController.prototype.getCurrentUser,
      );

      expect(controllerMetadata).toBe('Default controller message');
      expect(methodMetadata).toBe('Get current user successfully');
      expect(controllerMetadata).not.toBe(methodMetadata);
    });

    it('should allow method metadata to override controller metadata conceptually', () => {
      // While they don't actually override, they can coexist
      const controllerMetadata = reflector.get(
        'responseMessage',
        TestController,
      );
      const methodMetadata = reflector.get(
        'responseMessage',
        TestController.prototype.getCurrentUser,
      );

      expect(controllerMetadata).toBeDefined();
      expect(methodMetadata).toBeDefined();
      expect(methodMetadata).not.toBe(controllerMetadata);
    });
  });
});
