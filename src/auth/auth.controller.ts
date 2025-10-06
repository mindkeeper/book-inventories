import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'src/utils/pipes/zod-pipe';
import { type SignUpDto, signUpSchema } from './schema/sign-up.schema';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SignUpEntity } from './entities/sign-up.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @UsePipes(new ZodValidationPipe(signUpSchema))
  @ApiBody({ type: SignUpEntity })
  signUp(@Body() signupDto: SignUpDto) {
    return this.authService.signUp(signupDto);
  }
}
