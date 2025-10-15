import { PrismaService } from 'src/commons/prisma.service';
import { GenresService } from './genres.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Genre } from '@prisma/client';

const genreMock: Genre[] = [
  {
    id: '1',
    name: 'Fiction',
    keyName: 'fiction',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Non-Fiction',
    keyName: 'non-fiction',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const db = {
  genre: {
    findMany: jest.fn().mockResolvedValue(genreMock),
  },
};
describe('GenresService', () => {
  let genreService: GenresService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        {
          provide: PrismaService,
          useValue: db,
        },
      ],
    }).compile();

    genreService = module.get<GenresService>(GenresService);
  });

  it('should be defined', () => {
    expect(genreService).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of genres', async () => {
      const result = await genreService.findAll();
      expect(result).toBeInstanceOf(Array<Genre>);
      expect(result).toHaveLength(2);
    });
  });
});
