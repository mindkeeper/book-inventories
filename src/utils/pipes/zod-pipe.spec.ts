import { ArgumentMetadata } from '@nestjs/common';
import { ZodValidationPipe } from './zod-pipe';
import { z, ZodError } from 'zod';

describe('ZodValidationPipe', () => {
  let pipe: ZodValidationPipe;

  describe('with string schema', () => {
    beforeEach(() => {
      const stringSchema = z.string();
      pipe = new ZodValidationPipe(stringSchema);
    });

    it('should be defined', () => {
      expect(pipe).toBeDefined();
    });

    it('should validate and return valid string input', () => {
      const validInput = 'test string';
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: String,
        data: undefined,
      };

      const result = pipe.transform(validInput, metadata);

      expect(result).toBe(validInput);
    });

    it('should throw ZodError for invalid string input', () => {
      const invalidInput = 123;
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: String,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });

    it('should throw ZodError for null input', () => {
      const invalidInput = null;
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: String,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });

    it('should throw ZodError for undefined input', () => {
      const invalidInput = undefined;
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: String,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });
  });

  describe('with number schema', () => {
    beforeEach(() => {
      const numberSchema = z.number();
      pipe = new ZodValidationPipe(numberSchema);
    });

    it('should validate and return valid number input', () => {
      const validInput = 42;
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Number,
        data: undefined,
      };

      const result = pipe.transform(validInput, metadata);

      expect(result).toBe(validInput);
    });

    it('should throw ZodError for string input when expecting number', () => {
      const invalidInput = 'not a number';
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Number,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });
  });

  describe('with object schema', () => {
    const objectSchema = z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().email(),
    });

    beforeEach(() => {
      pipe = new ZodValidationPipe(objectSchema);
    });

    it('should validate and return valid object input', () => {
      const validInput = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      const result = pipe.transform(validInput, metadata);

      expect(result).toEqual(validInput);
    });

    it('should throw ZodError for object with missing required fields', () => {
      const invalidInput = {
        name: 'John Doe',
        // missing age and email
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });

    it('should throw ZodError for object with invalid field types', () => {
      const invalidInput = {
        name: 123, // should be string
        age: 'thirty', // should be number
        email: 'invalid-email', // should be valid email
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });

    it('should throw ZodError for object with invalid email format', () => {
      const invalidInput = {
        name: 'John Doe',
        age: 30,
        email: 'not-an-email',
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });
  });

  describe('with array schema', () => {
    const arraySchema = z.array(z.string());

    beforeEach(() => {
      pipe = new ZodValidationPipe(arraySchema);
    });

    it('should validate and return valid array input', () => {
      const validInput = ['item1', 'item2', 'item3'];
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Array,
        data: undefined,
      };

      const result = pipe.transform(validInput, metadata);

      expect(result).toEqual(validInput);
    });

    it('should validate and return empty array', () => {
      const validInput: string[] = [];
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Array,
        data: undefined,
      };

      const result = pipe.transform(validInput, metadata);

      expect(result).toEqual(validInput);
    });

    it('should throw ZodError for array with invalid item types', () => {
      const invalidInput = ['item1', 123, 'item3']; // 123 is not a string
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Array,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });

    it('should throw ZodError for non-array input', () => {
      const invalidInput = 'not an array';
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Array,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });
  });

  describe('with complex nested schema', () => {
    const nestedSchema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string(),
          age: z.number().min(0).max(120),
        }),
        preferences: z.array(z.string()),
      }),
      metadata: z.record(z.string(), z.string()),
    });

    beforeEach(() => {
      pipe = new ZodValidationPipe(nestedSchema);
    });

    it('should validate and return valid nested object', () => {
      const validInput = {
        user: {
          profile: {
            name: 'Alice',
            age: 25,
          },
          preferences: ['dark-mode', 'notifications'],
        },
        metadata: {
          source: 'web',
          version: '1.0.0',
        },
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      const result = pipe.transform(validInput, metadata);

      expect(result).toEqual(validInput);
    });

    it('should throw ZodError for nested object with invalid age', () => {
      const invalidInput = {
        user: {
          profile: {
            name: 'Alice',
            age: 150, // exceeds max age of 120
          },
          preferences: ['dark-mode'],
        },
        metadata: {
          source: 'web',
        },
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });
  });

  describe('with optional fields schema', () => {
    const optionalSchema = z.object({
      name: z.string(),
      age: z.number().optional(),
      email: z.string().email().optional(),
    });

    beforeEach(() => {
      pipe = new ZodValidationPipe(optionalSchema);
    });

    it('should validate object with only required fields', () => {
      const validInput = {
        name: 'John Doe',
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      const result = pipe.transform(validInput, metadata);

      expect(result).toEqual(validInput);
    });

    it('should validate object with all fields including optional ones', () => {
      const validInput = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      const result = pipe.transform(validInput, metadata);

      expect(result).toEqual(validInput);
    });

    it('should throw ZodError when required field is missing', () => {
      const invalidInput = {
        age: 30,
        email: 'john@example.com',
        // missing required name field
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
    });
  });

  describe('metadata parameter handling', () => {
    const stringSchema = z.string();

    beforeEach(() => {
      pipe = new ZodValidationPipe(stringSchema);
    });

    it('should work with different metadata types', () => {
      const validInput = 'test';
      const queryMetadata: ArgumentMetadata = {
        type: 'query',
        metatype: String,
        data: 'search',
      };

      const result = pipe.transform(validInput, queryMetadata);

      expect(result).toBe(validInput);
    });

    it('should work with param metadata', () => {
      const validInput = 'test-id';
      const paramMetadata: ArgumentMetadata = {
        type: 'param',
        metatype: String,
        data: 'id',
      };

      const result = pipe.transform(validInput, paramMetadata);

      expect(result).toBe(validInput);
    });

    it('should work with custom metadata', () => {
      const validInput = 'test';
      const customMetadata: ArgumentMetadata = {
        type: 'custom',
        metatype: String,
        data: 'custom-data',
      };

      const result = pipe.transform(validInput, customMetadata);

      expect(result).toBe(validInput);
    });
  });

  describe('error details', () => {
    const stringSchema = z.string();

    beforeEach(() => {
      pipe = new ZodValidationPipe(stringSchema);
    });

    it('should throw ZodError with proper error details', () => {
      const invalidInput = 123;
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: String,
        data: undefined,
      };

      try {
        pipe.transform(invalidInput, metadata);
        fail('Expected ZodError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        expect(zodError.issues).toHaveLength(1);
        expect(zodError.issues[0].code).toBe('invalid_type');
        expect(zodError.issues[0]).toHaveProperty('message');
      }
    });

    it('should throw ZodError with multiple validation issues', () => {
      const objectSchema = z.object({
        name: z.string(),
        age: z.number(),
      });
      pipe = new ZodValidationPipe(objectSchema);

      const invalidInput = {
        name: 123, // should be string
        age: 'thirty', // should be number
      };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: undefined,
      };

      try {
        pipe.transform(invalidInput, metadata);
        fail('Expected ZodError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        expect(zodError.issues).toHaveLength(2);
        expect(
          zodError.issues.some((issue) => issue.path.includes('name')),
        ).toBe(true);
        expect(
          zodError.issues.some((issue) => issue.path.includes('age')),
        ).toBe(true);
      }
    });
  });
});
