/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export interface IPaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
    previousPage: number | null;
    nextPage: number | null;
  };
}

export type TPaginateOptions = {
  page?: number;
  perPage?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
};

type PrismaDelegate = {
  findMany: (args: any) => Promise<any>;
  count: (args: any) => Promise<number>;
};

export type TPaginateFunction = <ModelDelegate extends PrismaDelegate, K>(
  model: ModelDelegate,
  args: Parameters<ModelDelegate['findMany']>[0],
  options: TPaginateOptions,
) => Promise<IPaginatedResult<K>>;

export const paginator = (
  defaultOptions: TPaginateOptions,
): TPaginateFunction => {
  return async (module, args: any = { where: undefined }, options) => {
    const page = options?.page || defaultOptions.page || 1;
    const perPage = options?.perPage || defaultOptions.perPage || 10;
    const skip = page > 0 ? (page - 1) * perPage : 0;

    const sortField =
      options?.sortField ?? defaultOptions.sortField ?? 'createdAt';
    const sortDirection =
      options?.sortDirection ?? defaultOptions.sortDirection ?? 'desc';

    // Preserve provided orderBy if exists; otherwise apply defaults
    const orderBy = args?.orderBy ?? { [sortField]: sortDirection };

    const [data, total] = await Promise.all([
      module.findMany({ ...args, skip, take: perPage, orderBy }),
      module.count({ where: args.where }),
    ]);
    const totalPages = Math.ceil(total / perPage) || 1;

    return {
      data,
      meta: {
        total,
        currentPage: page,
        perPage,
        totalPages,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null,
      },
    };
  };
};
