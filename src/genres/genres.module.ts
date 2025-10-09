import { Module } from '@nestjs/common';
import { GenresService } from './genres.service';
import { GenresController } from './genres.controller';
import { PrismaService } from 'src/commons/prisma.service';
import { PaginatorService } from 'src/commons/paginator.service';

@Module({
  controllers: [GenresController],
  providers: [GenresService, PrismaService, PaginatorService],
})
export class GenresModule {}
