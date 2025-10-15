import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
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
        .mockResolvedValue({ id: '1', email: 'alice@example.com', name: null });
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
        id: '1',
        email: 'alice@example.com',
        name: null,
        password: 'hashed',
      } as unknown as {
        id: string;
        email: string;
        name: string | null;
        password: string;
      });

      await expect(
        service.signUp({ email: 'alice@example.com', password: 'plain' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('signIn', () => {
    it('throws UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.signIn({ email: 'bob@example.com', password: 'pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException if password invalid', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'bob@example.com',
        name: null,
        password: 'hashed',
      } as unknown as {
        id: string;
        email: string;
        name: string | null;
        password: string;
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn({ email: 'bob@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns access token if credentials valid', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'bob@example.com',
        name: null,
        password: 'hashed',
      } as unknown as {
        id: string;
        email: string;
        name: string | null;
        password: string;
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const signSpy2 = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValue('valid-token');

      const result = await service.signIn({
        email: 'bob@example.com',
        password: 'secret',
      });

      expect(signSpy2).toHaveBeenCalledWith(
        { email: 'bob@example.com' },
        {
          secret: configService.get<string>('JWT_SECRET'),
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      );
      expect(result).toEqual({ access_token: 'valid-token' });
    });
  });
});
