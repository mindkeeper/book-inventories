import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/token/guards/jwt.guard';
import {
  GetCurrentUser,
  type TUser,
} from 'src/utils/decorators/current-user.decoreator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@GetCurrentUser() user: TUser) {
    return user;
  }
}
