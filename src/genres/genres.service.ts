import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/commons/prisma.service';

@Injectable()
export class GenresService {
  constructor(private prismaService: PrismaService) {}

  async findAll() {
    return this.prismaService.genre.findMany({
      select: {
        id: true,
        name: true,
        keyName: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
