import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { SignUpDto } from './schema/sign-up.schema';

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  signUp(data: SignUpDto) {
    return data;
  }
}
