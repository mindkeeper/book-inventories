import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CommonsModule } from 'src/commons/commons.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [CommonsModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
