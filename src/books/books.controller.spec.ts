import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SortDirection, SortField } from './dto/query.dto';
import { type BookDto } from './schemas/book.schema';
import { type BookUpdateDto } from './schemas/book.schema';
import { PrismaService } from 'src/commons/prisma.service';
import { PaginatorService } from 'src/commons/paginator.service';

type FindAllResponse = Awaited<ReturnType<BooksService['findAll']>>;
type FindOneResponse = Awaited<ReturnType<BooksService['findOne']>>;
type CreateResponse = Awaited<ReturnType<BooksService['create']>>;
type UpdateResponse = Awaited<ReturnType<BooksService['update']>>;
type DeleteResponse = Awaited<ReturnType<BooksService['delete']>>;

describe('BooksController (unit)', () => {
  let controller: BooksController;
  let service: jest.Mocked<BooksService>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [BooksService, PrismaService, PaginatorService],
    }).compile();

    controller = moduleRef.get(BooksController);
    service = moduleRef.get(BooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('delegates to BooksService and returns paginated data', async () => {
      const page = 2;
      const perPage = 5;
      const genre = 'fiction';
      const q = 'doe';
      const sortField = SortField.TITLE;
      const sortDirection = SortDirection.ASC;

      const expected: FindAllResponse = {
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

      const spy = jest.spyOn(service, 'findAll').mockResolvedValue(expected);

      const result = await controller.findAll(
        page,
        perPage,
        genre,
        q,
        sortField,
        sortDirection,
      );

      expect(spy).toHaveBeenCalledWith({
        page,
        perPage,
        genre,
        q,
        sortField,
        sortDirection,
      });
      expect(result).toEqual(expected);
    });

    it('propagates error from service', async () => {
      const page = 1;
      const perPage = 10;
      const genre = 'non-fiction';
      const q = 'smith';
      const sortField = SortField.CREATED_AT;
      const sortDirection = SortDirection.DESC;

      const error = new Error('Unexpected error');
      jest.spyOn(service, 'findAll').mockRejectedValue(error);

      await expect(
        controller.findAll(page, perPage, genre, q, sortField, sortDirection),
      ).rejects.toThrow('Unexpected error');
    });
  });

  describe('findOne', () => {
    it('delegates to BooksService and returns a book', async () => {
      const expected: FindOneResponse = {
        id: 'b1',
        title: 'Book 1',
        author: 'Author 1',
        published: 2020,
        genre: { name: 'Fiction', id: 'g1' },
      };
      const spy = jest.spyOn(service, 'findOne').mockResolvedValue(expected);

      const result = await controller.findOne('b1');

      expect(spy).toHaveBeenCalledWith('b1');
      expect(result).toEqual(expected);
    });

    it('propagates NotFoundException from service', async () => {
      const error = new NotFoundException('Book not found');
      jest.spyOn(service, 'findOne').mockRejectedValue(error);

      await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('delegates to BooksService and returns created book', async () => {
      const dto: BookDto = {
        title: 'New Book',
        author: 'New Author',
        published: 2024,
        genreId: 'g2',
      };
      const expected: CreateResponse = {
        id: 'b2',
        title: 'New Book',
        author: 'New Author',
        published: 2024,
        genre: { name: 'Non-Fiction' },
      };
      const spy = jest.spyOn(service, 'create').mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(spy).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('propagates BadRequestException from service', async () => {
      const dto: BookDto = {
        title: '',
        author: 'Author X',
        published: 2024,
        genreId: '',
      };
      const error = new BadRequestException('Invalid book data');
      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('delegates to BooksService and returns updated book', async () => {
      const id = 'b1';
      const dto: BookUpdateDto = {
        title: 'Updated Title',
        author: 'Updated Author',
      };
      const expected: UpdateResponse = {
        id: 'b1',
        title: 'Updated Title',
        author: 'Updated Author',
        published: 2020,
        genre: { name: 'Fiction' },
      };
      const spy = jest.spyOn(service, 'update').mockResolvedValue(expected);

      const result = await controller.update(id, dto);

      expect(spy).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expected);
    });

    it('delegates to BooksService with all fields', async () => {
      const id = 'b2';
      const dto: BookUpdateDto = {
        title: 'New Title',
        author: 'New Author',
        published: 2024,
        genreId: 'g2',
      };
      const expected: UpdateResponse = {
        id: 'b2',
        title: 'New Title',
        author: 'New Author',
        published: 2024,
        genre: { name: 'Non-Fiction' },
      };
      const spy = jest.spyOn(service, 'update').mockResolvedValue(expected);

      const result = await controller.update(id, dto);

      expect(spy).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expected);
    });

    it('propagates NotFoundException from service', async () => {
      const id = 'missing';
      const dto: BookUpdateDto = {
        title: 'Updated Title',
      };
      const error = new NotFoundException('Book not found');
      jest.spyOn(service, 'update').mockRejectedValue(error);

      await expect(controller.update(id, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('propagates BadRequestException from service', async () => {
      const id = 'b1';
      const dto: BookUpdateDto = {
        title: '',
      };
      const error = new BadRequestException('Invalid book data');
      jest.spyOn(service, 'update').mockRejectedValue(error);

      await expect(controller.update(id, dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('delegates to BooksService and returns deleted entity', async () => {
      const expected: DeleteResponse = {
        id: 'b3',
        title: 'Old Book',
        author: 'Author X',
        published: 2019,
        genre: { name: 'Fiction', id: 'g1' },
      };
      const spy = jest.spyOn(service, 'delete').mockResolvedValue(expected);

      const result = await controller.delete('b3');

      expect(spy).toHaveBeenCalledWith('b3');
      expect(result).toEqual(expected);
    });

    it('propagates NotFoundException from service', async () => {
      const error = new NotFoundException('Book not found');
      jest.spyOn(service, 'delete').mockRejectedValue(error);

      await expect(controller.delete('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
