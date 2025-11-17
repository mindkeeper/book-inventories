import { paginator, IPaginatedResult } from './paginator';

/**
 * Mock Prisma Model for testing
 */
interface MockUser {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
}

describe('paginator', () => {
  let mockFindMany: jest.Mock;
  let mockCount: jest.Mock;
  let mockModel: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  let mockUsers: MockUser[];

  beforeEach(() => {
    // Setup mock data
    mockUsers = [
      {
        id: 1,
        email: 'user1@example.com',
        name: 'User 1',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 2,
        email: 'user2@example.com',
        name: 'User 2',
        createdAt: new Date('2024-01-02'),
      },
      {
        id: 3,
        email: 'user3@example.com',
        name: 'User 3',
        createdAt: new Date('2024-01-03'),
      },
      {
        id: 4,
        email: 'user4@example.com',
        name: 'User 4',
        createdAt: new Date('2024-01-04'),
      },
      {
        id: 5,
        email: 'user5@example.com',
        name: 'User 5',
        createdAt: new Date('2024-01-05'),
      },
    ];

    // Setup mocks
    mockFindMany = jest.fn();
    mockCount = jest.fn();
    mockModel = {
      findMany: mockFindMany,
      count: mockCount,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Pagination Functionality', () => {
    it('should create a paginate function with default options', () => {
      const paginate = paginator({ page: 1, limit: 10 });

      expect(paginate).toBeInstanceOf(Function);
      expect(typeof paginate).toBe('function');
    });

    it('should return paginated results with correct structure', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0], mockUsers[1]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 2 });
      const result = await paginate(mockModel, {}, { page: 1, limit: 2 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('pagination');
      expect(result.meta.pagination).toHaveProperty('page');
      expect(result.meta.pagination).toHaveProperty('limit');
      expect(result.meta.pagination).toHaveProperty('total');
      expect(result.meta.pagination).toHaveProperty('totalPages');
    });

    it('should call findMany with correct skip and take parameters', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0], mockUsers[1]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 2 });
      await paginate(mockModel, {}, { page: 1, limit: 2 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 2,
        }),
      );
    });

    it('should call count with correct where clause', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(1);

      const paginate = paginator({ page: 1, limit: 10 });
      const whereClause = { email: { contains: 'test' } };

      await paginate(mockModel, { where: whereClause }, {});

      expect(mockCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: whereClause,
        }),
      );
    });

    it('should execute findMany and count in parallel', async () => {
      const findManyPromise = Promise.resolve([mockUsers[0]]);
      const countPromise = Promise.resolve(10);

      mockFindMany.mockReturnValue(findManyPromise);
      mockCount.mockReturnValue(countPromise);

      const paginate = paginator({ page: 1, limit: 10 });
      await paginate(mockModel, {}, {});

      expect(mockFindMany).toHaveBeenCalled();
      expect(mockCount).toHaveBeenCalled();
    });
  });

  describe('Pagination Calculation', () => {
    it('should calculate skip correctly for page 1', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0], mockUsers[1]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 2 });
      await paginate(mockModel, {}, { page: 1, limit: 2 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        }),
      );
    });

    it('should calculate skip correctly for page 2', async () => {
      mockFindMany.mockResolvedValue([mockUsers[2], mockUsers[3]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 2 });
      await paginate(mockModel, {}, { page: 2, limit: 2 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 2,
        }),
      );
    });

    it('should calculate skip correctly for page 3', async () => {
      mockFindMany.mockResolvedValue([mockUsers[4]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 2 });
      await paginate(mockModel, {}, { page: 3, limit: 2 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 4,
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0], mockUsers[1]]);
      mockCount.mockResolvedValue(25);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 1, limit: 10 });

      expect(result.meta.pagination.totalPages).toBe(3);
    });

    it('should return totalPages as 1 when total is 0', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 1, limit: 10 });

      expect(result.meta.pagination.totalPages).toBe(1);
    });

    it('should handle exact division for totalPages', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0], mockUsers[1]]);
      mockCount.mockResolvedValue(20);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 1, limit: 10 });

      expect(result.meta.pagination.totalPages).toBe(2);
    });

    it('should round up for totalPages calculation', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(21);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 1, limit: 10 });

      expect(result.meta.pagination.totalPages).toBe(3);
    });
  });

  describe('Default Options Merging', () => {
    it('should use default page when not provided in options', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0], mockUsers[1]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 2, limit: 2 });
      const result = await paginate(mockModel, {}, {});

      expect(result.meta.pagination.page).toBe(2);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 2,
        }),
      );
    });

    it('should use default limit when not provided in options', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0], mockUsers[1]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 5 });
      const result = await paginate(mockModel, {}, {});

      expect(result.meta.pagination.limit).toBe(5);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it('should override default options with provided options', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 3, limit: 5 });

      expect(result.meta.pagination.page).toBe(3);
      expect(result.meta.pagination.limit).toBe(5);
    });

    it('should use default sortField when not provided', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({
        page: 1,
        limit: 10,
        sortField: 'createdAt',
      });
      await paginate(mockModel, {}, {});

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should use default sortOrder when not provided', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({
        page: 1,
        limit: 10,
        sortField: 'id',
        sortOrder: 'asc',
      });
      await paginate(mockModel, {}, {});

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { id: 'asc' },
        }),
      );
    });

    it('should override default sortField with provided option', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({
        page: 1,
        limit: 10,
        sortField: 'createdAt',
      });
      await paginate(mockModel, {}, { sortField: 'name' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        }),
      );
    });

    it('should override default sortOrder with provided option', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({
        page: 1,
        limit: 10,
        sortField: 'id',
        sortOrder: 'desc',
      });
      await paginate(mockModel, {}, { sortOrder: 'asc' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { id: 'asc' },
        }),
      );
    });
  });

  describe('Sorting Options', () => {
    it('should apply ascending sort order', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      await paginate(mockModel, {}, { sortField: 'email', sortOrder: 'asc' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { email: 'asc' },
        }),
      );
    });

    it('should apply descending sort order', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      await paginate(mockModel, {}, { sortField: 'name', sortOrder: 'desc' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        }),
      );
    });

    it('should sort by custom field', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      await paginate(mockModel, {}, { sortField: 'email' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { email: 'desc' },
        }),
      );
    });

    it('should default to createdAt field when no sortField is provided', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      await paginate(mockModel, {}, {});

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should default to desc order when no sortOrder is provided', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      await paginate(mockModel, {}, { sortField: 'id' });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { id: 'desc' },
        }),
      );
    });
  });

  describe('Query Arguments Handling', () => {
    it('should pass through where clause to findMany', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(1);

      const paginate = paginator({ page: 1, limit: 10 });
      const whereClause = { email: { contains: 'test' } };

      await paginate(mockModel, { where: whereClause }, {});

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: whereClause,
        }),
      );
    });

    it('should pass through include clause to findMany', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(1);

      const paginate = paginator({ page: 1, limit: 10 });
      const includeClause = { posts: true };

      await paginate(mockModel, { include: includeClause }, {});

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: includeClause,
        }),
      );
    });

    it('should pass through select clause to findMany', async () => {
      mockFindMany.mockResolvedValue([{ id: 1, email: 'test@test.com' }]);
      mockCount.mockResolvedValue(1);

      const paginate = paginator({ page: 1, limit: 10 });
      const selectClause = { id: true, email: true };

      await paginate(mockModel, { select: selectClause }, {});

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: selectClause,
        }),
      );
    });

    it('should handle empty args object', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      await paginate(mockModel, {}, {});

      expect(mockFindMany).toHaveBeenCalled();
      expect(mockCount).toHaveBeenCalledWith({});
    });

    it('should handle complex where conditions', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(1);

      const paginate = paginator({ page: 1, limit: 10 });
      const complexWhere = {
        AND: [
          { email: { contains: 'test' } },
          { name: { startsWith: 'User' } },
        ],
      };

      await paginate(mockModel, { where: complexWhere }, {});

      expect(mockCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: complexWhere,
        }),
      );
    });

    it('should handle undefined where clause', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      await paginate(mockModel, { where: undefined }, {});

      expect(mockCount).toHaveBeenCalledWith({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle page 0 by defaulting to page 1', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 0 });

      expect(result.meta.pagination.page).toBe(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        }),
      );
    });

    it('should handle negative page by defaulting to page 1', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: -5 });

      expect(result.meta.pagination.page).toBe(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        }),
      );
    });

    it('should handle limit 0 by defaulting to limit 1', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { limit: 0 });

      expect(result.meta.pagination.limit).toBe(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        }),
      );
    });

    it('should handle negative limit by defaulting to limit 1', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { limit: -10 });

      expect(result.meta.pagination.limit).toBe(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        }),
      );
    });

    it('should handle empty result set', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, {});

      expect(result.data).toEqual([]);
      expect(result.meta.pagination.total).toBe(0);
      expect(result.meta.pagination.totalPages).toBe(1);
    });

    it('should handle large page numbers', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 1000 });

      expect(result.meta.pagination.page).toBe(1000);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 9990,
        }),
      );
    });

    it('should handle large limit numbers', async () => {
      mockFindMany.mockResolvedValue(mockUsers);
      mockCount.mockResolvedValue(5);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { limit: 1000 });

      expect(result.meta.pagination.limit).toBe(1000);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000,
        }),
      );
    });

    it('should handle single item result', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(1);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.pagination.total).toBe(1);
      expect(result.meta.pagination.totalPages).toBe(1);
    });
  });

  describe('Result Structure', () => {
    it('should return data array', async () => {
      const expectedData = [mockUsers[0], mockUsers[1]];
      mockFindMany.mockResolvedValue(expectedData);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 2 });
      const result = await paginate(mockModel, {}, {});

      expect(result.data).toEqual(expectedData);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return correct page in meta', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 3 });

      expect(result.meta.pagination.page).toBe(3);
    });

    it('should return correct limit in meta', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { limit: 5 });

      expect(result.meta.pagination.limit).toBe(5);
    });

    it('should return correct total in meta', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(42);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, {});

      expect(result.meta.pagination.total).toBe(42);
    });

    it('should return correct totalPages in meta', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(42);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, {});

      expect(result.meta.pagination.totalPages).toBe(5);
    });
  });

  describe('Type Safety and Generics', () => {
    it('should maintain type safety for returned data', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(1);

      const paginate = paginator({ page: 1, limit: 10 });
      const result: IPaginatedResult<MockUser> = await paginate(
        mockModel,
        {},
        {},
      );

      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('email');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('createdAt');
    });

    it('should work with different model types', async () => {
      interface MockPost {
        id: number;
        title: string;
        content: string;
      }

      const mockPosts: MockPost[] = [
        { id: 1, title: 'Post 1', content: 'Content 1' },
      ];

      const mockPostModel = {
        findMany: jest.fn().mockResolvedValue(mockPosts),
        count: jest.fn().mockResolvedValue(1),
      };

      const paginate = paginator({ page: 1, limit: 10 });
      const result: IPaginatedResult<MockPost> = await paginate(
        mockPostModel,
        {},
        {},
      );

      expect(result.data[0]).toHaveProperty('title');
      expect(result.data[0]).toHaveProperty('content');
    });
  });

  describe('Error Handling', () => {
    it('should propagate findMany errors', async () => {
      const error = new Error('Database connection failed');
      mockFindMany.mockRejectedValue(error);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });

      await expect(paginate(mockModel, {}, {})).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should propagate count errors', async () => {
      const error = new Error('Count query failed');
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockRejectedValue(error);

      const paginate = paginator({ page: 1, limit: 10 });

      await expect(paginate(mockModel, {}, {})).rejects.toThrow(
        'Count query failed',
      );
    });

    it('should handle both queries failing', async () => {
      const error = new Error('Database error');
      mockFindMany.mockRejectedValue(error);
      mockCount.mockRejectedValue(error);

      const paginate = paginator({ page: 1, limit: 10 });

      await expect(paginate(mockModel, {}, {})).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('Real-world Use Cases', () => {
    it('should handle typical first page request', async () => {
      mockFindMany.mockResolvedValue(mockUsers.slice(0, 10));
      mockCount.mockResolvedValue(100);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 1, limit: 10 });

      expect(result.meta.pagination.page).toBe(1);
      expect(result.meta.pagination.limit).toBe(10);
      expect(result.meta.pagination.total).toBe(100);
      expect(result.meta.pagination.totalPages).toBe(10);
    });

    it('should handle filtered pagination', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(1);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(
        mockModel,
        {
          where: { email: { contains: 'user1' } },
        },
        { page: 1, limit: 10 },
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.pagination.total).toBe(1);
    });

    it('should handle pagination with sorting', async () => {
      mockFindMany.mockResolvedValue([mockUsers[4], mockUsers[3]]);
      mockCount.mockResolvedValue(5);

      const paginate = paginator({
        page: 1,
        limit: 10,
        sortField: 'createdAt',
        sortOrder: 'desc',
      });
      await paginate(mockModel, {}, { page: 1, limit: 2 });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should handle last page with partial results', async () => {
      mockFindMany.mockResolvedValue([mockUsers[0]]);
      mockCount.mockResolvedValue(21);

      const paginate = paginator({ page: 1, limit: 10 });
      const result = await paginate(mockModel, {}, { page: 3, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.pagination.page).toBe(3);
      expect(result.meta.pagination.totalPages).toBe(3);
    });

    it('should handle pagination with relations', async () => {
      const usersWithPosts = [
        {
          ...mockUsers[0],
          posts: [{ id: 1, title: 'Post 1' }],
        },
      ];

      mockFindMany.mockResolvedValue(usersWithPosts);
      mockCount.mockResolvedValue(10);

      const paginate = paginator({ page: 1, limit: 10 });
      await paginate(mockModel, { include: { posts: true } }, {});

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { posts: true },
        }),
      );
    });
  });
});
