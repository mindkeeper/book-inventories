import { Test, TestingModule } from '@nestjs/testing';
import { PaginatorService } from './paginator.service';
import { IPaginatedResult } from 'src/utils/paginator/paginator';

describe('PaginatorService', () => {
  let service: PaginatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaginatorService],
    }).compile();

    service = module.get<PaginatorService>(PaginatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('paginate function', () => {
    // Mock Prisma model for testing
    const createMockModel = (data: any[], total: number) => ({
      findMany: jest.fn().mockResolvedValue(data),
      count: jest.fn().mockResolvedValue(total),
    });

    describe('initialization and default options', () => {
      it('should initialize with default pagination options', () => {
        expect(service.paginate).toBeDefined();
        expect(typeof service.paginate).toBe('function');
      });

      it('should use default options when no options provided', async () => {
        const mockData = [
          { id: 1, name: 'Item 1', createdAt: new Date() },
          { id: 2, name: 'Item 2', createdAt: new Date() },
        ];
        const mockModel = createMockModel(mockData, 2);

        const result = await service.paginate(mockModel, {}, {});

        // Verify findMany was called with default options
        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0, // (page 1 - 1) * limit 10
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        expect(result.meta.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        });
      });
    });

    describe('pagination options', () => {
      it('should override default page option', async () => {
        const mockData = [{ id: 3, name: 'Item 3' }];
        const mockModel = createMockModel(mockData, 25);

        await service.paginate(mockModel, {}, { page: 3 });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 20, // (page 3 - 1) * limit 10
          take: 10,
          orderBy: { createdAt: 'desc' },
        });
      });

      it('should override default limit option', async () => {
        const mockData = Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
        }));
        const mockModel = createMockModel(mockData, 100);

        const result = await service.paginate(mockModel, {}, { limit: 20 });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        });

        expect(result.meta.pagination.limit).toBe(20);
      });

      it('should override default sortField option', async () => {
        const mockData = [{ id: 1, name: 'Item 1', updatedAt: new Date() }];
        const mockModel = createMockModel(mockData, 1);

        await service.paginate(mockModel, {}, { sortField: 'updatedAt' });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
          orderBy: { updatedAt: 'desc' },
        });
      });

      it('should override default sortOrder option', async () => {
        const mockData = [{ id: 1, name: 'Item 1' }];
        const mockModel = createMockModel(mockData, 1);

        await service.paginate(mockModel, {}, { sortOrder: 'asc' });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'asc' },
        });
      });

      it('should apply multiple custom options simultaneously', async () => {
        const mockData = Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
        }));
        const mockModel = createMockModel(mockData, 50);

        const result = await service.paginate(
          mockModel,
          {},
          {
            page: 2,
            limit: 5,
            sortField: 'name',
            sortOrder: 'asc',
          },
        );

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 5, // (page 2 - 1) * limit 5
          take: 5,
          orderBy: { name: 'asc' },
        });

        expect(result.meta.pagination).toEqual({
          page: 2,
          limit: 5,
          total: 50,
          totalPages: 10,
        });
      });
    });

    describe('edge cases', () => {
      it('should handle page 0 by converting to page 1', async () => {
        const mockData = [{ id: 1, name: 'Item 1' }];
        const mockModel = createMockModel(mockData, 1);

        const result = await service.paginate(mockModel, {}, { page: 0 });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        expect(result.meta.pagination.page).toBe(1);
      });

      it('should handle negative page by converting to page 1', async () => {
        const mockData = [{ id: 1, name: 'Item 1' }];
        const mockModel = createMockModel(mockData, 1);

        const result = await service.paginate(mockModel, {}, { page: -5 });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        expect(result.meta.pagination.page).toBe(1);
      });

      it('should handle limit 0 by converting to limit 1', async () => {
        const mockData = [{ id: 1, name: 'Item 1' }];
        const mockModel = createMockModel(mockData, 1);

        const result = await service.paginate(mockModel, {}, { limit: 0 });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 1,
          orderBy: { createdAt: 'desc' },
        });

        expect(result.meta.pagination.limit).toBe(1);
      });

      it('should handle negative limit by converting to limit 1', async () => {
        const mockData = [{ id: 1, name: 'Item 1' }];
        const mockModel = createMockModel(mockData, 1);

        const result = await service.paginate(mockModel, {}, { limit: -10 });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 1,
          orderBy: { createdAt: 'desc' },
        });

        expect(result.meta.pagination.limit).toBe(1);
      });

      it('should handle empty result set', async () => {
        const mockModel = createMockModel([], 0);

        const result = await service.paginate(mockModel, {}, {});

        expect(result.data).toEqual([]);
        expect(result.meta.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1, // Minimum 1 page even with no data
        });
      });

      it('should handle page beyond total pages', async () => {
        const mockModel = createMockModel([], 10);

        const result = await service.paginate(
          mockModel,
          {},
          { page: 10, limit: 10 },
        );

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 90, // (page 10 - 1) * limit 10
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        expect(result.data).toEqual([]);
        expect(result.meta.pagination).toEqual({
          page: 10,
          limit: 10,
          total: 10,
          totalPages: 1,
        });
      });
    });

    describe('query args integration', () => {
      it('should pass where clause to findMany and count', async () => {
        const mockData = [{ id: 1, name: 'Active Item', status: 'active' }];
        const mockModel = createMockModel(mockData, 1);

        const args = {
          where: { status: 'active' },
        };

        await service.paginate(mockModel, args, { page: 1, limit: 10 });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          where: { status: 'active' },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        expect(mockModel.count).toHaveBeenCalledWith({
          where: { status: 'active' },
        });
      });

      it('should pass include clause to findMany', async () => {
        const mockData = [
          { id: 1, name: 'User 1', posts: [{ id: 1, title: 'Post 1' }] },
        ];
        const mockModel = createMockModel(mockData, 1);

        const args = {
          where: { active: true },
          include: { posts: true },
        };

        await service.paginate(mockModel, args, {});

        expect(mockModel.findMany).toHaveBeenCalledWith({
          where: { active: true },
          include: { posts: true },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        // Count should only receive where clause
        expect(mockModel.count).toHaveBeenCalledWith({
          where: { active: true },
        });
      });

      it('should handle complex query args with select', async () => {
        const mockData = [{ id: 1, name: 'Item 1' }];
        const mockModel = createMockModel(mockData, 1);

        const args = {
          where: { status: 'active', deleted: false },
          select: { id: true, name: true, createdAt: true },
        };

        await service.paginate(mockModel, args, { page: 1 });

        expect(mockModel.findMany).toHaveBeenCalledWith({
          where: { status: 'active', deleted: false },
          select: { id: true, name: true, createdAt: true },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        });
      });

      it('should handle empty args object', async () => {
        const mockData = [{ id: 1 }];
        const mockModel = createMockModel(mockData, 1);

        await service.paginate(mockModel, {}, {});

        expect(mockModel.findMany).toHaveBeenCalledWith({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        });

        expect(mockModel.count).toHaveBeenCalledWith({});
      });
    });

    describe('pagination metadata calculation', () => {
      it('should calculate totalPages correctly for exact division', async () => {
        const mockModel = createMockModel([], 100);

        const result = await service.paginate(mockModel, {}, { limit: 10 });

        expect(result.meta.pagination.totalPages).toBe(10);
      });

      it('should round up totalPages for remainder', async () => {
        const mockModel = createMockModel([], 95);

        const result = await service.paginate(mockModel, {}, { limit: 10 });

        expect(result.meta.pagination.totalPages).toBe(10);
      });

      it('should handle single item with large limit', async () => {
        const mockModel = createMockModel([{ id: 1 }], 1);

        const result = await service.paginate(mockModel, {}, { limit: 100 });

        expect(result.meta.pagination).toEqual({
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        });
      });

      it('should handle many items with small limit', async () => {
        const mockModel = createMockModel([], 1000);

        const result = await service.paginate(mockModel, {}, { limit: 1 });

        expect(result.meta.pagination).toEqual({
          page: 1,
          limit: 1,
          total: 1000,
          totalPages: 1000,
        });
      });
    });

    describe('return structure', () => {
      it('should return correct IPaginatedResult structure', async () => {
        const mockData = [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ];
        const mockModel = createMockModel(mockData, 2);

        const result: IPaginatedResult<(typeof mockData)[0]> =
          await service.paginate(mockModel, {}, {});

        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('meta');
        expect(result.meta).toHaveProperty('pagination');
        expect(result.meta.pagination).toHaveProperty('page');
        expect(result.meta.pagination).toHaveProperty('limit');
        expect(result.meta.pagination).toHaveProperty('total');
        expect(result.meta.pagination).toHaveProperty('totalPages');
      });

      it('should return data array with correct items', async () => {
        const mockData = [
          { id: 1, name: 'Item 1', createdAt: new Date('2024-01-01') },
          { id: 2, name: 'Item 2', createdAt: new Date('2024-01-02') },
          { id: 3, name: 'Item 3', createdAt: new Date('2024-01-03') },
        ];
        const mockModel = createMockModel(mockData, 3);

        const result = await service.paginate(mockModel, {}, {});

        expect(result.data).toEqual(mockData);
        expect(result.data.length).toBe(3);
      });
    });

    describe('concurrent query execution', () => {
      it('should execute findMany and count in parallel', async () => {
        const mockData = [{ id: 1, name: 'Item 1' }];
        let findManyCallTime = 0;
        let countCallTime = 0;

        const mockModel = {
          findMany: jest.fn().mockImplementation(async () => {
            findManyCallTime = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 10));
            return mockData;
          }),
          count: jest.fn().mockImplementation(async () => {
            countCallTime = Date.now();
            await new Promise((resolve) => setTimeout(resolve, 10));
            return 1;
          }),
        };

        await service.paginate(mockModel, {}, {});

        expect(mockModel.findMany).toHaveBeenCalled();
        expect(mockModel.count).toHaveBeenCalled();

        // Both should be called at approximately the same time (parallel execution)
        // If they were sequential, the difference would be at least 10ms
        const timeDifference = Math.abs(findManyCallTime - countCallTime);
        expect(timeDifference).toBeLessThan(5); // Allow small margin
      });
    });
  });
});
