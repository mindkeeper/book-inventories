/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService (basic unit tests)', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const usersServiceMock: jest.Mocked<UsersService> = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const configServiceMock: jest.Mocked<ConfigService> = {
      get: jest.fn((key: 'JWT_SECRET' | 'JWT_EXPIRATION'): string => {
        const map = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRATION: '1h',
        } as const;
        return map[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const jwtServiceMock: jest.Mocked<JwtService> = {
      signAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
    configService = moduleRef.get(ConfigService);
    jwtService = moduleRef.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('creates a new user and returns access token', async () => {
      const findSpy = jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pass');
      const createSpy = jest
        .spyOn(usersService, 'createUser')
        .mockResolvedValue({
          id: 'user-id-123',
          email: 'alice@example.com',
          name: null,
        });
      const signSpy = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValue('token-1');

      const result = await service.signUp({
        email: 'alice@example.com',
        password: 'plain',
      });

      expect(findSpy).toHaveBeenCalledWith('alice@example.com');
      expect(createSpy).toHaveBeenCalledWith({
        email: 'alice@example.com',
        password: 'hashed-pass',
      });
      expect(signSpy).toHaveBeenCalledWith(
        { email: 'alice@example.com' },
        {
          secret: configService.get<string>('JWT_SECRET'),
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      );
      expect(result).toEqual({ access_token: 'token-1' });
    });

    it('throws BadRequestException if user already exists', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-id-123',
        email: 'alice@example.com',
        name: null,
        password: 'hashed',
      });

      await expect(
        service.signUp({ email: 'alice@example.com', password: 'plain' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('hashPassword', () => {
    it('hashes password using bcrypt', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.hashPassword('plain-password');

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
      expect(result).toBe('hashed-password');
    });
  });

  describe('generateToken', () => {
    it('generates JWT token with email payload', async () => {
      const signSpy = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValue('generated-token');

      const result = await service.generateToken('user@example.com');

      expect(signSpy).toHaveBeenCalledWith(
        { email: 'user@example.com' },
        {
          secret: 'test-secret',
          expiresIn: '1h',
        },
      );
      expect(result).toBe('generated-token');
    });
  });

  describe('validateUser', () => {
    it('returns user if found', async () => {
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        name: 'User',
        password: 'hashed',
      };
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('user@example.com');

      expect(usersService.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(result).toEqual(mockUser);
    });

    it('returns null if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('returns user without password if credentials are valid', async () => {
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        name: 'User',
        password: 'hashed-password',
      };
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.authenticate(
        'user@example.com',
        'plain-password',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plain-password',
        'hashed-password',
      );
      expect(result).toEqual({
        id: 'user-id-123',
        email: 'user@example.com',
        name: 'User',
      });
    });

    it('returns null if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.authenticate(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('returns undefined if password is invalid', async () => {
      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        name: 'User',
        password: 'hashed-password',
      };
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.authenticate(
        'user@example.com',
        'wrong-password',
      );

      expect(result).toBeUndefined();
    });
  });
});
