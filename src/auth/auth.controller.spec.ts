/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './schema/sign-up.schema';
import { TUser } from 'src/utils/decorators/current-user.decoreator';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      signUp: jest.fn(),
      generateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should delegate to authService.signUp and return the result', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = { access_token: 'jwt-token' };

      authService.signUp.mockResolvedValue(expectedResult);

      const result = await controller.signUp(signUpDto);

      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toBe(expectedResult);
    });

    it('should propagate BadRequestException from authService.signUp', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.signUp.mockRejectedValue(
        new BadRequestException('User already exists'),
      );

      await expect(controller.signUp(signUpDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
    });
  });

  describe('signIn', () => {
    it('should generate token for authenticated user', async () => {
      const user: TUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Bob',
      };
      const mockRequest = { user };
      const expectedToken = 'jwt-token';

      authService.generateToken.mockResolvedValue(expectedToken);

      const result = await controller.signIn(mockRequest);

      expect(authService.generateToken).toHaveBeenCalledWith(user.email);
      expect(result).toBe(expectedToken);
    });

    it('should propagate errors from authService.generateToken', async () => {
      const user: TUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Bob',
      };
      const mockRequest = { user };

      authService.generateToken.mockRejectedValue(
        new UnauthorizedException('Token generation failed'),
      );

      await expect(controller.signIn(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.generateToken).toHaveBeenCalledWith(user.email);
    });
  });
});
