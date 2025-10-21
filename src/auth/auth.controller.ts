import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'src/utils/pipes/zod-pipe';
import { type SignUpDto, signUpSchema } from './schema/sign-up.schema';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignUpEntity, SignUpResponse } from './entities/sign-up.entity';
import { signInSchema } from './schema/sign-in.schema';
import {
  SignInEntity,
  SignInError,
  SignInResponse,
} from './entities/sign-in.entity';
import { LocalAuthGuard } from './guards/local.guard';
import { type TUser } from 'src/utils/decorators/current-user.decoreator';

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
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  signIn(@Request() request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = request.user as TUser;
    const token = this.authService.generateToken(user.email);
    return { access_token: token };
  }
}
