import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonsModule } from './commons/commons.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';

@Module({
  imports: [CommonsModule, UsersModule, AuthModule, BooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
