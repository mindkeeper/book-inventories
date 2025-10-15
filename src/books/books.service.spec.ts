/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { PrismaService } from 'src/commons/prisma.service';
import { PaginatorService } from 'src/commons/paginator.service';
import { NotFoundException } from '@nestjs/common';
import { BooksQueryDto, SortField, SortDirection } from './dto/query.dto';
import { type BookDto } from './schemas/book.schema';
// Use shallow jest.Mocked types; cast nested Prisma delegate methods to jest.Mock when setting return values

describe('BooksService (unit)', () => {
  let service: BooksService;
  let prisma: jest.Mocked<PrismaService>;
  let paginator: jest.Mocked<PaginatorService>;

  beforeEach(async () => {
    const prismaMock: jest.Mocked<PrismaService> = {
      book: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const paginatorMock: jest.Mocked<PaginatorService> = {
      paginate: jest.fn(),
    } as unknown as jest.Mocked<PaginatorService>;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PaginatorService, useValue: paginatorMock },
      ],
    }).compile();

    service = moduleRef.get(BooksService);
    prisma = moduleRef.get(PrismaService);
    paginator = moduleRef.get(PaginatorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('paginates books with filters and sorting and returns data/meta', async () => {
      const query: BooksQueryDto = {
        page: 2,
        perPage: 5,
        q: 'doe',
        genre: 'fiction',
        sortField: SortField.TITLE,
        sortDirection: SortDirection.ASC,
      };

      const expected = {
        data: [
          {
            id: '1',
            title: 'A Tale',
            author: 'John Doe',
            published: 2022,
            genre: { name: 'Fiction' },
          },
        ],
        meta: {
          total: 11,
          currentPage: 2,
          perPage: 5,
          totalPages: 3,
          previousPage: 1,
          nextPage: 3,
        },
      };

      paginator.paginate.mockResolvedValue(expected);

      const result = await service.findAll(query);

      expect(paginator.paginate).toHaveBeenCalledWith(
        prisma.book,
        expect.objectContaining({
          // Use a broad matcher to avoid unsafe assignment warnings
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              // Service uses OR for q filter (title/author contains)
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({
                    title: expect.objectContaining({
                      contains: 'doe' as string,
                    }),
                  }),
                ]),
              }),
              expect.objectContaining({
                // Match the service filter structure: genre.is.keyName
                genre: expect.objectContaining({
                  is: expect.objectContaining({ keyName: 'fiction' as string }),
                }),
              }),
            ]),
          }),
          orderBy: expect.objectContaining({
            [SortField.TITLE]: SortDirection.ASC,
          }),
          select: expect.objectContaining({
            id: true,
            title: true,
            author: true,
            published: true,
            // genre select is present in service; we don't require it here, but keep matcher permissive
          }),
        }),
        { page: 2, perPage: 5 },
      );

      // Additional focused assertion on the actual args to keep intent strong
      // Precisely type the captured args to avoid unsafe member access warnings
      type BookFindManyArgs = Parameters<PrismaService['book']['findMany']>[0];
      const actualArgs = paginator.paginate.mock
        .calls[0][1] as BookFindManyArgs;
      expect(actualArgs?.where).toEqual(
        expect.objectContaining({ AND: expect.any(Array) }),
      );
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('returns a book when found', async () => {
      const expected = {
        id: 'b1',
        title: 'Book 1',
        author: 'Author 1',
        published: 2020,
        genre: { name: 'Fiction', id: 'g1' },
      };
      (prisma.book.findUnique as unknown as jest.Mock).mockResolvedValue(
        expected,
      );

      const result = await service.findOne('b1');
      expect(prisma.book.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'b1' } }),
      );
      expect(result).toEqual(expected);
    });

    it('throws NotFoundException when book is not found', async () => {
      (prisma.book.findUnique as unknown as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns a book', async () => {
      const dto: BookDto = {
        title: 'New Book',
        author: 'New Author',
        published: 2024,
        genreId: 'g2',
      };
      const created = {
        id: 'b2',
        title: 'New Book',
        author: 'New Author',
        published: 2024,
        genre: { name: 'Non-Fiction' },
      };
      (prisma.book.create as unknown as jest.Mock).mockResolvedValue(created);

      const result = await service.create(dto);
      expect(prisma.book.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            title: 'New Book',
            author: 'New Author',
            published: 2024,
            genreId: 'g2',
          },
        }),
      );
      expect(result).toEqual(created);
    });
  });

  describe('delete', () => {
    it('deletes an existing book and returns the deleted entity', async () => {
      const existing = {
        id: 'b3',
        title: 'Old Book',
        author: 'Author X',
        published: 2019,
        genre: { name: 'Fiction', id: 'g1' },
      };
      (prisma.book.findUnique as unknown as jest.Mock).mockResolvedValue(
        existing,
      );
      (prisma.book.delete as unknown as jest.Mock).mockResolvedValue({});

      const result = await service.delete('b3');
      expect(prisma.book.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'b3' } }),
      );
      // Service returns the entity found via findOne
      expect(result).toEqual(existing);
    });

    it('throws NotFoundException when deleting a missing book', async () => {
      (prisma.book.findUnique as unknown as jest.Mock).mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
