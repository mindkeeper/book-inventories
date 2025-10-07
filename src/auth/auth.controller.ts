import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'src/utils/pipes/zod-pipe';
import { type SignUpDto, signUpSchema } from './schema/sign-up.schema';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignUpEntity, SignUpResponse } from './entities/sign-up.entity';
import { type SignInDto, signInSchema } from './schema/sign-in.schema';
import {
  SignInEntity,
  SignInError,
  SignInResponse,
} from './entities/sign-in.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @UsePipes(new ZodValidationPipe(signUpSchema))
  @ApiBody({ type: SignUpEntity })
  @ApiResponse({
    status: 200,
    description: 'User successfully registered and token are generated.',
    type: SignUpResponse,
  })
  signUp(@Body() signupDto: SignUpDto) {
    return this.authService.signUp(signupDto);
  }

  @Post('sign-in')
  @UsePipes(new ZodValidationPipe(signInSchema))
  @ApiBody({ type: SignInEntity })
  @ApiResponse({
    status: 200,
    description: 'User successfully signed in and token is generated.',
    type: SignInResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid credentials.',
    type: SignInError,
  })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }
}
