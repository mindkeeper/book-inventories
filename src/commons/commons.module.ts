import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { config } from 'src/config/config';
import { TokenModule } from './token.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      load: [config],
    }),
    TokenModule,
    PassportModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService, TokenModule, PassportModule],
})
export class CommonsModule {}
