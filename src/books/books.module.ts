import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { PaginatorService } from 'src/commons/paginator.service';
import { PrismaService } from 'src/commons/prisma.service';

@Module({
  controllers: [BooksController],
  providers: [BooksService, PaginatorService, PrismaService],
})
export class BooksModule {}
