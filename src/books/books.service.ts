import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatorService } from 'src/commons/paginator.service';
import { PrismaService } from 'src/commons/prisma.service';
import { BooksQueryDto, BooksCursorQueryDto, SortField } from './dto/query.dto';
import { BookDto, BookUpdateDto } from './schemas/book.schema';

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
      { page: query.page, limit: query.perPage },
    );
    return { data, meta };
  }

  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
  async findAllCursor(queryParams: BooksCursorQueryDto) {
    const conditions: any[] = [];

    if (queryParams.q) {
      conditions.push({
        OR: [
          { title: { contains: queryParams.q, mode: 'insensitive' } },
          { author: { contains: queryParams.q, mode: 'insensitive' } },
        ],
      });
    }
    if (queryParams.genre) {
      conditions.push({
        genre: {
          is: {
            keyName: queryParams.genre,
          },
        },
      });
    }

    const { data, meta } = await this.paginator.cursorPaginate(
      this.prismaService.book,
      {
        where: {
          AND: conditions,
        },
        select: {
          id: true,
          title: true,
          author: true,
          published: true,
          createdAt: true,
          genre: {
            select: {
              name: true,
            },
          },
        },
      },
      {
        cursor: queryParams.cursor,
        limit: queryParams.limit,
        sortField: queryParams.sortField || SortField.CREATED_AT,
        sortOrder: queryParams.sortDirection,
      },
    );
    return { data, meta };
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

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

  async update(id: string, bookDto: BookUpdateDto) {
    // First check if the book exists
    await this.findOne(id);

    // Filter out undefined values to only update provided fields
    const updateData: Partial<{
      title: string;
      author: string;
      published: number;
      genreId: string;
    }> = {};

    if (bookDto.title !== undefined) updateData.title = bookDto.title;
    if (bookDto.author !== undefined) updateData.author = bookDto.author;
    if (bookDto.published !== undefined)
      updateData.published = bookDto.published;
    if (bookDto.genreId !== undefined) updateData.genreId = bookDto.genreId;

    const book = await this.prismaService.book.update({
      where: { id: id },
      data: updateData,
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
