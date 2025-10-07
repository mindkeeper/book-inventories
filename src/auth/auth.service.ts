import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { SignUpDto } from './schema/sign-up.schema';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './schema/sign-in.schema';
@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  async signUp(data: SignUpDto) {
    const user = await this.userService.findByEmail(data.email);
    if (user) {
      throw new BadRequestException('User already exists');
    }
    const hashedPassword = await this.hashPassword(data.password);
    const newUser = await this.userService.createUser({
      email: data.email,
      password: hashedPassword,
    });
    const token = await this.generateToken(newUser.email);
    return { access_token: token };
  }

  async signIn(data: SignInDto) {
    const user = await this.userService.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = await this.generateToken(user.email);
    return { access_token: token };
  }

  async hashPassword(password: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  }

  async generateToken(email: string) {
    const payload = { email };
    const token = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRATION'),
    });
    return token;
  }

  async validateUser(email: string) {
    return this.userService.findByEmail(email);
  }
}
