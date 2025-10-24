/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Reflector } from '@nestjs/core';
import { responseMessage } from './response.decorator';

describe('responseMessage Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('responseMessage decorator function', () => {
    it('should be defined', () => {
      expect(responseMessage).toBeDefined();
      expect(typeof responseMessage).toBe('function');
    });

    it('should return a decorator function', () => {
      const decorator = responseMessage('Test message');
      expect(typeof decorator).toBe('function');
    });
  });

  describe('Metadata setting functionality', () => {
    it('should set metadata on class with string message', () => {
      const testMessage = 'Test response message';

      @responseMessage(testMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(testMessage);
    });

    it('should set metadata on method with string message', () => {
      const testMessage = 'Method response message';

      class TestController {
        @responseMessage(testMessage)
        testMethod() {
          return 'test';
        }
      }

      const metadata = reflector.get(
        'responseMessage',
        TestController.prototype.testMethod,
      );
      expect(metadata).toBe(testMessage);
    });

    it('should handle empty string message', () => {
      const emptyMessage = '';

      @responseMessage(emptyMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(emptyMessage);
    });

    it('should handle long message strings', () => {
      const longMessage =
        'This is a very long response message that contains multiple words and should be handled correctly by the decorator';

      @responseMessage(longMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(longMessage);
    });

    it('should handle messages with special characters', () => {
      const specialMessage =
        'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

      @responseMessage(specialMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(specialMessage);
    });

    it('should handle unicode and emoji messages', () => {
      const unicodeMessage = 'Success! ✅ User created successfully 🎉';

      @responseMessage(unicodeMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(unicodeMessage);
    });
  });

  describe('Multiple decorator applications', () => {
    it('should allow different messages on different methods', () => {
      const message1 = 'First method message';
      const message2 = 'Second method message';

      class TestController {
        @responseMessage(message1)
        firstMethod() {
          return 'first';
        }

        @responseMessage(message2)
        secondMethod() {
          return 'second';
        }
      }

      const metadata1 = reflector.get(
        'responseMessage',
        TestController.prototype.firstMethod,
      );
      const metadata2 = reflector.get(
        'responseMessage',
        TestController.prototype.secondMethod,
      );

      expect(metadata1).toBe(message1);
      expect(metadata2).toBe(message2);
      expect(metadata1).not.toBe(metadata2);
    });

    it('should allow same message on different methods', () => {
      const sharedMessage = 'Shared response message';

      class TestController {
        @responseMessage(sharedMessage)
        firstMethod() {
          return 'first';
        }

        @responseMessage(sharedMessage)
        secondMethod() {
          return 'second';
        }
      }

      const metadata1 = reflector.get(
        'responseMessage',
        TestController.prototype.firstMethod,
      );
      const metadata2 = reflector.get(
        'responseMessage',
        TestController.prototype.secondMethod,
      );

      expect(metadata1).toBe(sharedMessage);
      expect(metadata2).toBe(sharedMessage);
      expect(metadata1).toBe(metadata2);
    });

    it('should handle class and method decorators independently', () => {
      const classMessage = 'Class level message';
      const methodMessage = 'Method level message';

      @responseMessage(classMessage)
      class TestController {
        @responseMessage(methodMessage)
        testMethod() {
          return 'test';
        }

        normalMethod() {
          return 'normal';
        }
      }

      const classMetadata = reflector.get('responseMessage', TestController);
      const methodMetadata = reflector.get(
        'responseMessage',
        TestController.prototype.testMethod,
      );
      const normalMethodMetadata = reflector.get(
        'responseMessage',
        TestController.prototype.normalMethod,
      );

      expect(classMetadata).toBe(classMessage);
      expect(methodMetadata).toBe(methodMessage);
      expect(normalMethodMetadata).toBeUndefined();
    });
  });

  describe('Metadata key validation', () => {
    it('should use the correct metadata key "responseMessage"', () => {
      const testMessage = 'Key validation test';

      @responseMessage(testMessage)
      class TestController {}

      // Test with correct key
      const correctMetadata = reflector.get('responseMessage', TestController);
      expect(correctMetadata).toBe(testMessage);

      // Test with incorrect key
      const incorrectMetadata = reflector.get('wrongKey', TestController);
      expect(incorrectMetadata).toBeUndefined();
    });

    it('should not interfere with other metadata keys', () => {
      const testMessage = 'Non-interference test';
      const otherMetadata = 'Other metadata value';

      @responseMessage(testMessage)
      class TestController {}

      // Manually set other metadata after class declaration
      Reflect.defineMetadata('otherKey', otherMetadata, TestController);

      const responseMetadata = reflector.get('responseMessage', TestController);
      const otherRetrievedMetadata = reflector.get('otherKey', TestController);

      expect(responseMetadata).toBe(testMessage);
      expect(otherRetrievedMetadata).toBe(otherMetadata);
    });
  });

  describe('Type safety and validation', () => {
    it('should accept string messages', () => {
      const stringMessage = 'String message test';

      expect(() => {
        @responseMessage(stringMessage)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestController {}
      }).not.toThrow();
    });

    it('should work with template literals', () => {
      const dynamicPart = 'dynamic';
      const templateMessage = `This is a ${dynamicPart} message`;

      @responseMessage(templateMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe('This is a dynamic message');
    });

    it('should handle numeric strings', () => {
      const numericMessage = '12345';

      @responseMessage(numericMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(numericMessage);
      expect(typeof metadata).toBe('string');
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace-only messages', () => {
      const whitespaceMessage = '   ';

      @responseMessage(whitespaceMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(whitespaceMessage);
    });

    it('should handle newline characters in messages', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';

      @responseMessage(multilineMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(multilineMessage);
    });

    it('should handle tab characters in messages', () => {
      const tabbedMessage = 'Column1\tColumn2\tColumn3';

      @responseMessage(tabbedMessage)
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(tabbedMessage);
    });
  });

  describe('Decorator composition', () => {
    it('should work alongside other decorators', () => {
      const testMessage = 'Composition test message';

      // Mock other decorators
      const mockDecorator = jest.fn().mockReturnValue(() => {});

      @responseMessage(testMessage)
      @mockDecorator()
      class TestController {}

      const metadata = reflector.get('responseMessage', TestController);
      expect(metadata).toBe(testMessage);
      expect(mockDecorator).toHaveBeenCalled();
    });

    it('should maintain metadata when used with multiple decorators', () => {
      const responseMsg = 'Response message';

      // Create a simple test decorator
      const TestDecorator = (value: string) => {
        return (target: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          Reflect.defineMetadata('testKey', value, target);
        };
      };

      @responseMessage(responseMsg)
      @TestDecorator('test value')
      class TestController {}

      const responseMetadata = reflector.get('responseMessage', TestController);
      const testMetadata = reflector.get('testKey', TestController);

      expect(responseMetadata).toBe(responseMsg);
      expect(testMetadata).toBe('test value');
    });
  });
});
