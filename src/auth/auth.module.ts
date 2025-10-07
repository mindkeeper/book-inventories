import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CommonsModule } from 'src/commons/commons.module';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from 'src/token/strategies/jwt.strategy';

@Module({
  imports: [CommonsModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
