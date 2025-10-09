import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatorService } from 'src/commons/paginator.service';
import { PrismaService } from 'src/commons/prisma.service';
import { BooksQueryDto, SortField } from './dto/query.dto';
import { BookDto } from './schemas/book.schema';

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
          { title: { contains: query.q, mode: 'insensitive' } },
          { author: { contains: query.q, mode: 'insensitive' } },
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

  async findOne(id: string) {
    const book = await this.prismaService.book.findUnique({
      where: { id: id },
      select: {
        id: true,
        title: true,
        author: true,
        published: true,
        genre: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async create(bookDto: BookDto) {
    const book = await this.prismaService.book.create({
      data: {
        title: bookDto.title,
        author: bookDto.author,
        published: bookDto.published,
        genreId: bookDto.genreId,
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
    });
    return book;
  }
  async delete(id: string) {
    const book = await this.findOne(id);
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    await this.prismaService.book.delete({
      where: { id: id },
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
    });
    return book;
  }
}
