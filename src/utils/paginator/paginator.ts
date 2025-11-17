/**
 * Pagination result interface with data and metadata
 * @template T - The type of items in the paginated result
 */
export interface IPaginatedResult<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Pagination options for offset-based pagination
 */
export interface IPaginateOptions {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Type-safe Prisma delegate interface
 * Ensures the model has the required findMany and count methods
 * @template TArgs - The type of arguments accepted by findMany
 * @template TResult - The type of result returned by findMany
 */
interface IPrismaDelegate<TArgs, TResult> {
  findMany: (args: TArgs) => Promise<TResult[]>;
  count: (args?: Partial<TArgs>) => Promise<number>;
}

/**
 * Type-safe paginate function interface
 * @template ModelDelegate - The Prisma model delegate type
 * @template K - The type of items in the result
 */
export interface IPaginateFunction {
  <
    ModelDelegate extends IPrismaDelegate<TArgs, TResult>,
    TArgs,
    TResult,
    K = TResult,
  >(
    model: ModelDelegate,
    args: Parameters<ModelDelegate['findMany']>[0],
    options: IPaginateOptions,
  ): Promise<IPaginatedResult<K>>;
}

/**
 * Creates a type-safe offset-based paginator function with default options
 * Follows Prisma best practices for offset pagination using skip and take
 *
 * @param defaultOptions - Default pagination options (page, limit, sortField, sortOrder)
 * @returns A paginate function that can be used with any Prisma model
 *
 * @example
 * ```typescript
 * const paginate = paginator({ page: 1, limit: 10, sortField: 'createdAt', sortOrder: 'desc' });
 *
 * const result = await paginate(
 *   prisma.user,
 *   {
 *     where: { active: true },
 *     include: { posts: true }
 *   },
 *   { page: 2, limit: 20 }
 * );
 * ```
 */
export const paginator = (
  defaultOptions: IPaginateOptions,
): IPaginateFunction => {
  return async <TArgs, TResult, K = TResult>(
    model: IPrismaDelegate<TArgs, TResult>,
    args: TArgs = {} as TArgs,
    options: IPaginateOptions = {},
  ): Promise<IPaginatedResult<K>> => {
    // Merge options with defaults, ensuring positive values
    const page = Math.max(1, options.page ?? defaultOptions.page ?? 1);
    const limit = Math.max(1, options.limit ?? defaultOptions.limit ?? 10);
    const sortField =
      options.sortField ?? defaultOptions.sortField ?? 'createdAt';
    const sortOrder = options.sortOrder ?? defaultOptions.sortOrder ?? 'desc';

    // Calculate skip value for offset pagination
    const skip = (page - 1) * limit;

    // Build orderBy object dynamically
    const orderBy = { [sortField]: sortOrder };

    // Prepare query arguments with pagination and sorting
    const queryArgs = {
      ...args,
      skip,
      take: limit,
      orderBy,
    } as TArgs;

    // Extract where clause for count query
    const whereClause = (args as { where?: unknown })?.where;
    const countArgs = (
      whereClause ? { where: whereClause } : {}
    ) as Partial<TArgs>;

    // Execute queries in parallel for better performance
    // This prevents N+1 query problems
    const [data, total] = await Promise.all([
      model.findMany(queryArgs),
      model.count(countArgs),
    ]);

    // Calculate total pages, minimum 1
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: data as unknown as K[],
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  };
};
