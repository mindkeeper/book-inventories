import { Injectable } from '@nestjs/common';
import { PaginatorService } from 'src/commons/paginator.service';
import { PrismaService } from 'src/commons/prisma.service';
import { BooksQueryDto, SortField } from './dto/query.dto';

@Injectable()
export class BooksService {
  constructor(
    private prismaService: PrismaService,
    private paginator: PaginatorService,
  ) {}
  async findAll(query: BooksQueryDto) {
    const conditions: any[] = [];

    if (query.q) {
      conditions.push({
        OR: [
          { title: { contains: query.q } },
          { author: { contains: query.q } },
        ],
      });
    }
    if (query.genre) {
      conditions.push({
        genre: {
          is: {
            keyName: query.genre,
          },
        },
      });
    }

    const { data, meta } = await this.paginator.paginate(
      this.prismaService.book,
      {
        where: {
          AND: conditions,
        },
        orderBy: {
          [query.sortField || SortField.CREATED_AT]: query.sortDirection,
        },
        select: {
          id: true,
          title: true,
          author: true,
          published: true,
          genre: {
            select: {
              name: true,
            },
          },
        },
      },
      { page: query.page, perPage: query.perPage },
    );
    return { data, meta };
  }
}
