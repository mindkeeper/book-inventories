import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './schema/sign-up.schema';
import { SignInDto } from './schema/sign-in.schema';

type SignUpResponse = Awaited<ReturnType<AuthService['signUp']>>;
type SignInResponse = Awaited<ReturnType<AuthService['signIn']>>;

describe('AuthController (unit)', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const serviceMock: jest.Mocked<AuthService> = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      // helpers not directly used by controller
      hashPassword: jest.fn(),
      generateToken: jest.fn(),
      validateUser: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(AuthController);
    service = moduleRef.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('delegates to AuthService and returns token', async () => {
      const dto: SignUpDto = {
        email: 'alice@example.com',
        password: 'pass123',
      };
      const expected: SignUpResponse = { access_token: 'token-1' };
      const signUpSpy = jest
        .spyOn(service, 'signUp')
        .mockResolvedValue(expected);

      const result = await controller.signUp(dto);

      expect(signUpSpy).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('propagates BadRequestException from service', async () => {
      const dto: SignUpDto = {
        email: 'existing@example.com',
        password: 'pass123',
      };
      const error = new BadRequestException('User already exists');
      jest.spyOn(service, 'signUp').mockRejectedValue(error);

      await expect(controller.signUp(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('signIn', () => {
    it('delegates to AuthService and returns token', async () => {
      const dto: SignInDto = { email: 'bob@example.com', password: 'secret' };
      const expected: SignInResponse = { access_token: 'token-2' };
      const signInSpy = jest
        .spyOn(service, 'signIn')
        .mockResolvedValue(expected);

      const result = await controller.signIn(dto);

      expect(signInSpy).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('propagates UnauthorizedException from service', async () => {
      const dto: SignInDto = { email: 'bob@example.com', password: 'wrong' };
      const error = new UnauthorizedException('Invalid credentials');
      jest.spyOn(service, 'signIn').mockRejectedValue(error);

      await expect(controller.signIn(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
