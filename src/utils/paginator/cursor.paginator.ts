/**
 * Cursor pagination result interface with data and metadata
 * @template T - The type of items in the paginated result
 */
export interface ICursorPaginatedResult<T> {
  data: T[];
  meta: {
    pagination: {
      limit: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      nextCursor: string | null;
      previousCursor: string | null;
    };
  };
}

/**
 * Cursor pagination options
 */
export interface ICursorPaginateOptions {
  cursor?: string; // Base64 encoded cursor
  limit?: number;
  sortField?: string; // Field to sort by (must be sortable, e.g., createdAt, updatedAt)
  sortOrder?: 'asc' | 'desc';
}

/**
 * Internal cursor structure for encoding/decoding
 */
interface ICursor {
  id: string; // CUID for uniqueness
  sortValue: string | number | Date; // Value of the sort field
}

/**
 * Type-safe Prisma delegate interface for cursor pagination
 * @template TArgs - The type of arguments accepted by findMany
 * @template TResult - The type of result returned by findMany
 */
interface IPrismaDelegate<TArgs, TResult> {
  findMany: (args: TArgs) => Promise<TResult[]>;
}

/**
 * Type-safe cursor paginate function interface
 * @template ModelDelegate - The Prisma model delegate type
 * @template K - The type of items in the result
 */
export interface ICursorPaginateFunction {
  <
    ModelDelegate extends IPrismaDelegate<TArgs, TResult>,
    TArgs,
    TResult,
    K = TResult,
  >(
    model: ModelDelegate,
    args: Parameters<ModelDelegate['findMany']>[0],
    options: ICursorPaginateOptions,
  ): Promise<ICursorPaginatedResult<K>>;
}

/**
 * Encodes cursor data to base64 string
 */
const encodeCursor = (cursor: ICursor): string => {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
};

/**
 * Decodes base64 cursor string to cursor object
 */
const decodeCursor = (cursorString: string): ICursor => {
  try {
    const decoded = JSON.parse(
      Buffer.from(cursorString, 'base64').toString('utf-8'),
    ) as ICursor;
    return decoded;
  } catch {
    throw new Error('Invalid cursor format');
  }
};

/**
 * Creates a type-safe cursor-based paginator function with default options
 * Follows Prisma best practices for cursor pagination
 *
 * Note: Since all IDs are CUIDs (non-sequential), this implementation uses
 * a combination of a sortable field (createdAt, updatedAt, etc.) and the ID
 * to ensure consistent and unique cursor positioning.
 *
 * @param defaultOptions - Default pagination options (limit, sortField, sortOrder)
 * @returns A paginate function that can be used with any Prisma model
 *
 * @example
 * ```typescript
 * const cursorPaginate = cursorPaginator({
 *   limit: 10,
 *   sortField: 'createdAt',
 *   sortOrder: 'desc'
 * });
 *
 * // First page
 * const result = await cursorPaginate(
 *   prisma.book,
 *   {
 *     where: { published: { gte: 2020 } },
 *     include: { genre: true }
 *   },
 *   { limit: 20 }
 * );
 *
 * // Next page using cursor
 * const nextPage = await cursorPaginate(
 *   prisma.book,
 *   {
 *     where: { published: { gte: 2020 } },
 *     include: { genre: true }
 *   },
 *   {
 *     cursor: result.meta.pagination.nextCursor,
 *     limit: 20
 *   }
 * );
 * ```
 */
export const cursorPaginator = (
  defaultOptions: ICursorPaginateOptions,
): ICursorPaginateFunction => {
  return async <TArgs, TResult, K = TResult>(
    model: IPrismaDelegate<TArgs, TResult>,
    args: TArgs = {} as TArgs,
    options: ICursorPaginateOptions = {},
  ): Promise<ICursorPaginatedResult<K>> => {
    // Merge options with defaults, ensuring positive values
    const limit = Math.max(1, options.limit ?? defaultOptions.limit ?? 10);
    const sortField =
      options.sortField ?? defaultOptions.sortField ?? 'createdAt';
    const sortOrder = options.sortOrder ?? defaultOptions.sortOrder ?? 'desc';
    const cursorString = options.cursor ?? defaultOptions.cursor;

    // Fetch one extra item to determine if there's a next page
    const take = limit + 1;

    // Build orderBy object dynamically
    // Use compound ordering: first by sortField, then by id for consistency
    const orderBy = [
      { [sortField]: sortOrder },
      { id: sortOrder }, // Secondary sort by id for deterministic ordering
    ];

    let queryArgs: TArgs;

    // If cursor is provided, decode it and build the where clause
    if (cursorString) {
      const cursor = decodeCursor(cursorString);

      // Build cursor-based where condition
      // For 'desc' order, we want records where sortField < cursor.sortValue
      // OR (sortField = cursor.sortValue AND id < cursor.id)
      // For 'asc' order, we want records where sortField > cursor.sortValue
      // OR (sortField = cursor.sortValue AND id > cursor.id)
      const operator = sortOrder === 'desc' ? 'lt' : 'gt';
      const orOperator = sortOrder === 'desc' ? 'lt' : 'gt';

      const existingWhere = (args as { where?: unknown })?.where || {};

      const cursorWhere = {
        OR: [
          {
            [sortField]: {
              [operator]: cursor.sortValue,
            },
          },
          {
            AND: [
              {
                [sortField]: cursor.sortValue,
              },
              {
                id: {
                  [orOperator]: cursor.id,
                },
              },
            ],
          },
        ],
      };

      // Merge cursor where with existing where using AND
      const mergedWhere =
        Object.keys(existingWhere).length > 0
          ? {
              AND: [existingWhere, cursorWhere],
            }
          : cursorWhere;

      queryArgs = {
        ...args,
        where: mergedWhere,
        take,
        orderBy,
      } as TArgs;
    } else {
      // No cursor, just apply ordering and limit
      queryArgs = {
        ...args,
        take,
        orderBy,
      } as TArgs;
    }

    // Fetch data
    const results = await model.findMany(queryArgs);

    // Determine if there's a next page
    const hasNextPage = results.length > limit;

    // Get the actual data (excluding the extra item if it exists)
    const data = hasNextPage ? results.slice(0, limit) : results;

    // Determine if there's a previous page (true if cursor was provided)
    const hasPreviousPage = !!cursorString;

    // Generate next cursor from the last item in data
    let nextCursor: string | null = null;
    if (hasNextPage && data.length > 0) {
      const lastItem = data[data.length - 1] as Record<string, unknown>;
      nextCursor = encodeCursor({
        id: lastItem.id as string,
        sortValue: lastItem[sortField] as string | number | Date,
      });
    }

    // Generate previous cursor from the first item in data
    // Note: This is a simplified approach. For full bidirectional pagination,
    // you might need to track both forward and backward cursors
    let previousCursor: string | null = null;
    if (hasPreviousPage && data.length > 0) {
      const firstItem = data[0] as Record<string, unknown>;
      previousCursor = encodeCursor({
        id: firstItem.id as string,
        sortValue: firstItem[sortField] as string | number | Date,
      });
    }

    return {
      data: data as unknown as K[],
      meta: {
        pagination: {
          limit,
          hasNextPage,
          hasPreviousPage,
          nextCursor,
          previousCursor,
        },
      },
    };
  };
};
