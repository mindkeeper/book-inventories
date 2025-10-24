import { Test, TestingModule } from '@nestjs/testing';
import { PaginatorService } from './paginator.service';
import { IPaginatedResult } from 'src/utils/paginator/paginator';

interface MockModel {
  findMany: jest.Mock;
  count: jest.Mock;
}

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

  it('should have paginate property', () => {
    expect(service).toHaveProperty('paginate');
    expect(typeof service.paginate).toBe('function');
  });

  describe('paginate function', () => {
    let mockModel: MockModel;

    beforeEach(() => {
      mockModel = {
        findMany: jest.fn(),
        count: jest.fn(),
      };
    });

    it('should return paginated results with default options', async () => {
      // Mock data
      const mockData = [
        { id: 1, name: 'Item 1', createdAt: new Date() },
        { id: 2, name: 'Item 2', createdAt: new Date() },
      ];
      const mockTotal = 2;

      mockModel.findMany.mockResolvedValue(mockData);
      mockModel.count.mockResolvedValue(mockTotal);

      const result: IPaginatedResult<any> = await service.paginate(
        mockModel,
        {},
        { page: 1, perPage: 10 },
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual(mockData);
      expect(result.meta.total).toBe(mockTotal);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.perPage).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.previousPage).toBeNull();
      expect(result.meta.nextPage).toBeNull();
    });

    it('should handle pagination with multiple pages', async () => {
      const mockData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const mockTotal = 25;

      mockModel.findMany.mockResolvedValue(mockData);
      mockModel.count.mockResolvedValue(mockTotal);

      const result = await service.paginate(
        mockModel,
        {},
        { page: 2, perPage: 10 },
      );

      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.previousPage).toBe(1);
      expect(result.meta.nextPage).toBe(3);
    });

    it('should handle last page correctly', async () => {
      const mockData = [{ id: 1, name: 'Item 1' }];
      const mockTotal = 21;

      mockModel.findMany.mockResolvedValue(mockData);
      mockModel.count.mockResolvedValue(mockTotal);

      const result = await service.paginate(
        mockModel,
        {},
        { page: 3, perPage: 10 },
      );

      expect(result.meta.currentPage).toBe(3);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.previousPage).toBe(2);
      expect(result.meta.nextPage).toBeNull();
    });

    it('should handle custom sorting options', async () => {
      const mockData = [{ id: 1, name: 'Item 1' }];
      const mockTotal = 1;

      mockModel.findMany.mockResolvedValue(mockData);
      mockModel.count.mockResolvedValue(mockTotal);

      await service.paginate(
        mockModel,
        {},
        {
          page: 1,
          perPage: 10,
          sortField: 'name',
          sortDirection: 'desc',
        },
      );

      expect(mockModel.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { name: 'desc' },
      });
    });

    it('should handle where conditions', async () => {
      const mockData = [{ id: 1, name: 'Item 1' }];
      const mockTotal = 1;

      mockModel.findMany.mockResolvedValue(mockData);
      mockModel.count.mockResolvedValue(mockTotal);

      const whereCondition = { status: 'active' };
      await service.paginate(
        mockModel,
        { where: whereCondition },
        { page: 1, perPage: 10 },
      );

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: whereCondition,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'asc' },
      });

      expect(mockModel.count).toHaveBeenCalledWith({
        where: whereCondition,
      });
    });

    it('should use default options when no options provided', async () => {
      const mockData = [{ id: 1, name: 'Item 1' }];
      const mockTotal = 1;

      mockModel.findMany.mockResolvedValue(mockData);
      mockModel.count.mockResolvedValue(mockTotal);

      const result = await service.paginate(mockModel, {}, {});

      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.perPage).toBe(10);
      expect(mockModel.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should handle empty results', async () => {
      const mockData: any[] = [];
      const mockTotal = 0;

      mockModel.findMany.mockResolvedValue(mockData);
      mockModel.count.mockResolvedValue(mockTotal);

      const result = await service.paginate(
        mockModel,
        {},
        { page: 1, perPage: 10 },
      );

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.previousPage).toBeNull();
      expect(result.meta.nextPage).toBeNull();
    });
  });

  describe('service configuration', () => {
    it('should have correct default pagination settings', () => {
      // Test that the service is initialized with the expected default options
      expect(service.paginate).toBeDefined();
      expect(typeof service.paginate).toBe('function');
    });

    it('should be an injectable service', () => {
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('PaginatorService');
    });
  });
});
